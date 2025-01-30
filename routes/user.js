const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// the CRUD operations needed from userService
const { createUser, loginUser, deleteUser, editUser } = require('../services/userService');

// security reasons, dont allow users to delete other user accounts and what not
const authenticateCookie = require('../middleware/authenticateCookie');

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // if username, email or password do not exist
    if (!username || !email || !password) {
        // status 400 is bad request
        return res.status(400).json({ error: 'username, email, and password are required to register!' });
    }

    // try to create a new user
    try {
        // status 201 is creation successful
        const newUser = await createUser(username, email, password );
        res.status(201).json({ message: 'user created successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        // status 400 is bad request
        return res.status(400).json({ error: 'username, and password are required to login!' });
    }

    try {
        // status 201 is creation successful
        const { token } = await loginUser(usernameOrEmail, password );
        res.status(201).json({ message: 'user logged in successfully', token: token });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }    
});

router.post('/delete-account', authenticateCookie, async (req, res) => {
    const { userId, usernameOrEmail, password } = req.body;

    // validate against auth user
    if (!req.user || req.user.id !== userId) {
        return res.status(401).json({ error: 'not a chance' });
    }

    try {
        // auth user
        const { user } = await loginUser(usernameOrEmail, password);

        if (!user || user.id !== req.user.id) {
            return res.status(401).json({ error: 'invalid username, email or password for this account' });
        }

        // make sure password is correct
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            return res.status(400).json({ error: 'invalid password' });
        }

        // delete account
        const deletedUser = await deleteUser(userId);
        if (!deletedUser || !deletedUser.username) {
            throw new Error('failed to delete user');
        }

        res.status(200).json({ message: `goodbye ${deletedUser.username} ;(` });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});



module.exports = router;