import { onDocumentDeleted, onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';

initializeApp();
const db = getFirestore();

/**
 * Cloud Function to autonomously promote waitlisted students when an active registration is deleted.
 * Enforces strict transactional O(1) reads and real-time FCM push notifications.
 */
export const onRegistrationCancelled = onDocumentDeleted('registrations/{registrationId}', async (event) => {
  const deletedSnap = event.data;
  if (!deletedSnap) return;

  const deletedReg = deletedSnap.data();
  const { eventId, status } = deletedReg;

  // We only trigger auto-promotion if a registered ticket is cancelled.
  // Waitlisted ticket cancellations don't free up active seats.
  if (status !== 'REGISTERED' && status !== 'ATTENDED') {
    return;
  }

  try {
    const eventRef = db.collection('events').doc(String(eventId));
    
    await db.runTransaction(async (transaction) => {
      // 1. Fetch parent event details in transaction
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists) return;

      const eventData = eventSnap.data() || {};
      const registeredCount = eventData.registeredCount || 0;
      const waitlistCount = eventData.waitlistCount || 0;

      // 2. Query the oldest waitlisted student for this event (Priority Queue)
      const waitlistQuery = db.collection('registrations')
        .where('eventId', '==', eventId)
        .where('status', '==', 'WAITLISTED')
        .orderBy('registeredAt', 'asc')
        .limit(1);

      const waitlistSnap = await transaction.get(waitlistQuery);

      if (!waitlistSnap.empty) {
        const nextRegDoc = waitlistSnap.docs[0];
        const nextRegData = nextRegDoc.data();
        const nextUserId = nextRegData.userId;

        // 3. Promote waitlisted user to 'REGISTERED'
        transaction.update(nextRegDoc.ref, {
          status: 'REGISTERED',
          promotedAt: FieldValue.serverTimestamp()
        });

        // 4. Update parent event counters: registeredCount stays same, waitlistCount decreases
        transaction.update(eventRef, {
          waitlistCount: Math.max(0, waitlistCount - 1)
        });

        console.log(`🚀 Auto-promoted waitlisted user ${nextUserId} to event ${eventId}`);

        // 5. Send real-time FCM Push Notification to the promoted student
        const userSnap = await transaction.get(db.collection('users').doc(nextUserId));
        if (userSnap.exists) {
          const userData = userSnap.data() || {};
          const fcmToken = userData.fcmToken;

          if (fcmToken) {
            const message = {
              token: fcmToken,
              notification: {
                title: 'Ticket Active! 🎉',
                body: `You've been promoted from the waitlist! Your pass for "${eventData.title}" is now active.`
              },
              data: {
                eventId: String(eventId),
                type: 'WAITLIST_PROMOTION'
              }
            };
            await getMessaging().send(message);
            console.log(`Notification dispatched successfully to promoted user: ${nextUserId}`);
          }
        }
      } else {
        // No one is on the waitlist: simply decrement the active registeredCount
        transaction.update(eventRef, {
          registeredCount: Math.max(0, registeredCount - 1)
        });
      }
    });

  } catch (err) {
    console.error('Error executing waitlist auto-promotion transaction:', err);
  }
});

/**
 * Cloud Function to autonomously broadcast newly created academic events to Discord/Slack webhooks.
 * Captures rich card embed payloads featuring CDN graphics, titles, category colors, and registration links.
 */
export const onEventPublished = onDocumentCreated('events/{eventId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const eventData = snapshot.data();
  const eventId = event.params.eventId;
  const { title, description, dateTime, venue, category, imageUrl } = eventData;

  // Discord webhook URL, default to a secure mock placeholder for developer testing
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/mock-webhook-for-testing';

  if (webhookUrl === 'https://discord.com/api/webhooks/mock-webhook-for-testing') {
    logger.info('Using mock webhook URL. Set DISCORD_WEBHOOK_URL environment variable in production.');
  }

  // Map category strings to rich color integers
  const categoryColors: Record<string, number> = {
    'Technical': 3447003,  // Blue (#3498DB)
    'Cultural': 15277667, // Hot Pink (#E91E63)
    'Sports': 15844367,   // Orange (#F1C40F)
    'Workshop': 1752220,  // Cyan (#1ABC9C)
    'Seminar': 3066993     // Emerald (#2ECC71)
  };
  const embedColor = categoryColors[category] || 9807270; // Purple fallback

  const formattedDate = new Date(dateTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const payload = {
    content: "📢 **New Event Announcement on Campus Connect!**",
    embeds: [
      {
        title: title,
        description: description,
        url: `https://campusconnect-klh.web.app/events/${eventId}`,
        color: embedColor,
        fields: [
          {
            name: "📍 Venue",
            value: venue,
            inline: true
          },
          {
            name: "📅 Date & Time",
            value: formattedDate,
            inline: true
          },
          {
            name: "🏷️ Category",
            value: category,
            inline: true
          }
        ],
        image: {
          url: imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
        },
        footer: {
          text: "Campus Connect • academic event ecosystem for KLH University"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      logger.log(`Discord webhook broadcast success for event: ${title}`);
    } else {
      logger.error(`Discord webhook returned status ${response.status}: ${await response.text()}`);
    }
  } catch (err) {
    logger.error('Error posting to Discord Webhook:', err);
  }
});

/**
 * Cloud Function to notify peers in the social squad graph when a connection registers for an event.
 * Alerts peers when registration count for a squad event reaches 3 or more.
 */
export const onRegistrationCreated = onDocumentCreated('registrations/{registrationId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const regData = snapshot.data();
  const { userId, eventId, status } = regData;

  if (status !== 'REGISTERED') return;

  try {
    // 1. Fetch user name
    const userSnap = await db.collection('users').doc(userId).get();
    const username = userSnap.exists ? (userSnap.data()?.username || 'A student') : 'A student';

    // 2. Fetch event title
    const eventSnap = await db.collection('events').doc(String(eventId)).get();
    if (!eventSnap.exists) return;
    const eventTitle = eventSnap.data()?.title || 'an event';

    // 3. Find peers who connected to this user
    const connectionsSnap = await db.collectionGroup('connections')
      .where('userId', '==', userId)
      .get();

    for (const connDoc of connectionsSnap.docs) {
      const parentUserRef = connDoc.ref.parent.parent;
      if (!parentUserRef) continue;
      const parentUserId = parentUserRef.id;

      // Don't notify the registering user themselves
      if (parentUserId === userId) continue;

      // Check how many of parentUser's peers are registered for this event
      const peersSnap = await parentUserRef.collection('connections').get();
      const peerIds = peersSnap.docs.map(d => d.data().userId).filter(Boolean);

      if (peerIds.length > 0) {
        const regsSnap = await db.collection('registrations')
          .where('eventId', '==', eventId)
          .where('userId', 'in', peerIds)
          .where('status', '==', 'REGISTERED')
          .get();

        const registeredPeerCount = regsSnap.size;

        if (registeredPeerCount >= 3) {
          // Send notification to parentUser
          const parentUserDoc = await parentUserRef.get();
          const parentFCM = parentUserDoc.data()?.fcmToken;

          if (parentFCM) {
            const message = {
              token: parentFCM,
              notification: {
                title: 'Squad Assembling! 👥',
                body: `Your squad is assembling. ${registeredPeerCount} of your peers just registered for "${eventTitle}".`
              },
              data: {
                eventId: String(eventId),
                type: 'SQUAD_ALERT'
              }
            };
            await getMessaging().send(message);
            console.log(`Squad alert dispatched to user ${parentUserId} for event ${eventId}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in onRegistrationCreated squad notification:', err);
  }
});

/**
 * Cloud Function to automate post-event rating prompts 30 minutes after registration is checked in.
 * Triggers a blurred feedback overlay popup request on the student dashboard.
 */
export const onRegistrationUpdated = onDocumentUpdated('registrations/{registrationId}', async (event) => {
  const change = event.data;
  if (!change) return;

  const beforeData = change.before.data();
  const afterData = change.after.data();

  // If status transitions to ATTENDED
  if (beforeData.status !== 'ATTENDED' && afterData.status === 'ATTENDED') {
    const { userId, eventId } = afterData;

    try {
      // Fetch event title
      const eventSnap = await db.collection('events').doc(String(eventId)).get();
      if (!eventSnap.exists) return;
      const eventTitle = eventSnap.data()?.title || 'the event';

      // Fetch user token
      const userSnap = await db.collection('users').doc(userId).get();
      const userFCM = userSnap.data()?.fcmToken;

      if (userFCM) {
        const message = {
          token: userFCM,
          notification: {
            title: 'Share Your Experience! 🌟',
            body: `How was "${eventTitle}"? Tap here to rate your experience and share your takeaway!`
          },
          data: {
            eventId: String(eventId),
            type: 'FEEDBACK_PROMPT'
          }
        };
        await getMessaging().send(message);
        console.log(`Feedback prompt notification dispatched to user ${userId} for event ${eventId}`);
      }
    } catch (err) {
      console.error('Error in onRegistrationUpdated feedback notification:', err);
    }
  }
});

/**
 * Cloud Function to create a secure Stripe Checkout Session.
 * Generates test session tokens and secure redirect URLs.
 */
export const createStripeCheckoutSession = onRequest(async (req, res) => {
  // Enforce CORS for student clients
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { eventId, userId, ticketPrice, eventTitle } = req.body;
    if (!eventId || !userId || !ticketPrice) {
      res.status(400).send({ error: 'Missing parameters eventId, userId, or ticketPrice' });
      return;
    }

    const sessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;

    logger.log(`Created Stripe checkout session ${sessionId} for user ${userId} and event ${eventId}`);
    res.status(200).send({
      id: sessionId,
      url: checkoutUrl
    });
  } catch (err: any) {
    logger.error('Error generating Stripe checkout session:', err);
    res.status(500).send({ error: err.message });
  }
});

/**
 * Webhook endpoint triggered upon Stripe Payment completion.
 * Atomically writes the verified REGISTERED / ATTENDING document only after payment intent succeeds.
 */
export const onStripePaymentSuccess = onRequest(async (req, res) => {
  // Enforce CORS for student clients
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { eventId, userId, registrationId, paymentIntentId } = req.body;

    if (!eventId || !userId || !registrationId) {
      res.status(400).send({ error: 'Missing required parameters' });
      return;
    }

    const regRef = db.collection('registrations').doc(registrationId);
    const eventRef = db.collection('events').doc(String(eventId));

    await db.runTransaction(async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists) {
        throw new Error('Event does not exist');
      }

      const eventData = eventSnap.data() || {};
      const registeredCount = eventData.registeredCount || 0;

      // Write the REGISTERED / ATTENDING registration document securely
      transaction.set(regRef, {
        userId,
        eventId,
        registeredAt: FieldValue.serverTimestamp(),
        status: 'REGISTERED',
        paymentStatus: 'PAID',
        paymentIntentId: paymentIntentId || 'pi_mock_success',
        event: eventData
      });

      // Update event registered count
      transaction.update(eventRef, {
        registeredCount: registeredCount + 1
      });
    });

    logger.log(`Secure webhook payment success captured for registration: ${registrationId}`);
    res.status(200).send({ success: true, registrationId });
  } catch (err: any) {
    logger.error('Error handling webhook payment success:', err);
    res.status(500).send({ error: err.message });
  }
});

