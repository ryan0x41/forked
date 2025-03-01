const express = require('express');
const authenticateAuthHeader = require('../middleware/authenticateAuthHeader');
const router = express.Router();
const { sendMessage, getMessageThread } = require('../services/messageService');
const { Message } = require('../models/Message');

const { getConversation } = require('../services/conversationService');
const { createNotification } = require('../services/notificationService');
const { Notification, NotificationType } = require('../models/Notification');

router.post('/send', authenticateAuthHeader, async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const sender = req.user.id;
        const messageToSend = new Message({ sender, conversationId, content });

        const { message } = await sendMessage(messageToSend);

        // for notifs, every participant in a conversation should recieve a notification
        const { conversation } = await getConversation(req.user.id, conversationId);
        // the sender should not recieve an notification for a message they sent
        const recipients = conversation.participants.filter(participant => participant !== sender);

        // for each recipient, create a notification for each of them
        for (const recipientId of recipients) {
            const messageNotification = new Notification({
                recipientId,
                notificationMessage: `${req.user.username} sent you a message.`,
                notificationType: NotificationType.MESSAGE,
            });
            await createNotification(messageNotification);
        }

        res.status(200).json({ message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/thread/:conversationId', authenticateAuthHeader, async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const messages = await getMessageThread(conversationId, req.user.id);

        res.status(200).json({ message: "message thread recieved", messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;