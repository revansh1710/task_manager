const express = require('express');
const app = express();
const dotenv = require('dotenv');
const connectDB = require('./db/mongoose.js');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Lists = require('./db/models/lists.model.js');
const Tasks = require('./db/models/tasks.model.js');
const user = require('./db/models/user.model.js');

// Load environment variables from .env file
dotenv.config();

// Set up middleware
app.use(cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");
    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token,x-refresh-token'
    );
    next();
})
app.use(bodyParser.json());

// Set the port
const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();

// Middleware to verify session
let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');
    if (!token) {
        console.error('Token not provided');
        return res.status(401).send({ error: 'No token provided' });
    }

    jwt.verify(token, user.getJWTSecret(), (err, decoded) => {
        if (err) {
            console.error('Token verification failed', err);
            return res.status(401).send({ error: 'Failed to authenticate token' });
        } else {
            req.user_id = decoded._id;
            next();
        }
    });
};

let verifySession = (req, res, next) => {
    let refreshToken = req.header('x-refresh-token');
    let _id = req.header('_id');
    console.log(`Received refreshToken: ${refreshToken}, user ID: ${_id}`);

    user.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            console.log("User not found or token invalid");
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user ID are valid'
            });
        }

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            console.log(`Checking session token: ${session.token}`);
            if (session.token === refreshToken) {
                if (user.hasRefreshTokenExpired(session.expiresAt) === false) {
                    console.log("Session is valid");
                    isSessionValid = true;
                } else {
                    console.log("Session has expired");
                }
            }
        });

        if (isSessionValid) {
            next();
        } else {
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            });
        }
    }).catch((e) => {
        console.error("Session validation failed:", e);
        res.status(401).send(e);
    });
};


// Routes
app.get('/lists', authenticate, (req, res) => {
    Lists.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.post('/lists', authenticate, (req, res) => {
    let title = req.body.title;
    let newList = new Lists({
        title,
        _userId: req.user_id
    });
    newList.save().then((listDoc) => {
        res.send(listDoc);
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.patch('/lists/:id', authenticate, (req, res) => {
    Lists.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id }, {
        $set: req.body
    }).then(() => {
        res.sendStatus({ 'message': 'updated Successfully' });
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.delete('/lists/:id', authenticate, (req, res) => {
    Lists.findOneAndDelete({ _id: req.params.id, _userId: req.user_id }).then((removedListDoc) => {
        res.send(removedListDoc);
        deleteTasksFromLists(removedListDoc._id);
    }).catch((err) => {
        res.status(400).send(err);
    });

});

app.get('/lists/:listId/tasks', authenticate, (req, res) => {
    Tasks.find({ _listId: req.params.listId }).then((tasks) => {
        res.send(tasks);
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.get('/lists/:listId/tasks/:taskId', (req, res) => {
    Tasks.findOne({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((task) => {
        res.send(task);
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.post('/lists/:listId/tasks', authenticate, (req, res) => {
    Lists.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            return true;
        }
        return false
    }).then((canCreateTask) => {
        if (canCreateTask) {
            let newTask = new Tasks({
                title: req.body.title,
                _listId: req.params.listId
            });
            newTask.save().then((newTaskDoc) => {
                res.send(newTaskDoc);
            }).catch((err) => {
                res.status(400).send(err);
            });
        }
        else {
            res.sendStatus(404);
        }
    })
});

app.patch('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {

    Lists.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            return true
        } else
            return false
    }).then((canUpdateTasks) => {
        if (canUpdateTasks) {
            Tasks.findOneAndUpdate({
                _id: req.params.taskId,
                _listId: req.params.listId
            }, {
                $set: req.body
            }).then(() => {
                res.send({ message: 'Updated Successfully' });
            }).catch((err) => {
                res.status(400).send(err);
            });
        }
        else {
            res.sendStatus(404);
        }
    })
});

app.delete('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
    Lists.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            return true
        } else
            return false
    }).then((canDeleteTasks) => {
        if (canDeleteTasks) {
            Tasks.findOneAndDelete({
                _id: req.params.taskId,
                _listId: req.params.listId
            }).then((removeTaskDoc) => {
                res.send(removeTaskDoc);
            }).catch((err) => {
                res.status(400).send(err);
            });
        }
        else {
            res.sendStatus(401);
        }
    })
});

// User Routes
app.post('/users', (req, res) => {
    let body = req.body;
    let newUser = new user(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        return newUser.generateAccessAuthToken().then((accessToken) => {
            return { accessToken, refreshToken };
        });
    }).then((authTokens) => {
        res.header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    user.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            return user.generateAccessAuthToken().then((accessToken) => {
                return { accessToken, refreshToken };
            });
        }).then((authTokens) => {
            res.header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        });
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.get('/users/me/accessToken', verifySession, (req, res) => {
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
});

let deleteTasksFromLists = (_listId) => {
    Tasks.deleteMany({
        _listId
    }).then(() => {
        console.log("Tasks from" + _listId + "were deleted")
    })
}
// Start the server
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
