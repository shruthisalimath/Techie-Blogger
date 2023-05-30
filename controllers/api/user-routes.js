const router = require('express').Router();
const { Post, User, Comment} = require('../../models');

//get all users - get/api /users
router.get('/', (req, res) => {
    //access our user model and run .findAll() method
    User.findAll({
        attributes: { exclude: ['password'] }
    })
    .then(dbUserData => res.json(dbUserData))
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});

//find one user
router.get('/:id', (req, res) => {
    User.findOne({
      where: {
        id: req.params.id
      }
      ,
      include: [
        {
          model: Post,
          attributes: ['id', 'title', 'content', 'created_at']
        },
        {
          model: Comment,
          attributes: ['id', 'feedback', 'created_at'],
          include: {
            model: Post,
            attributes: ['title']
          }
        },
      ]
    })
      .then(dbUserData => {
        if (!dbUserData) {
          res.status(404).json({ message: 'No user found with this id' });
          return;
        }
        res.json(dbUserData);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

  //create a new user with sign up button
  router.post('/', (req, res) => {
    // expects {username: 'Lernantino', email: 'lernantino@gmail.com', password: 'password1234'}
  User.create({
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password
  })
    .then(dbUserData => {   
      req.session.save(() => {
        req.session.user_id = dbUserData.id;
        req.session.userName = dbUserData.userName;
        req.session.email = dbUserData.email;
        req.session.loggedIn = true;

        res.json(dbUserData);     
      }); 
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

// Try to log in user with post and findone
router.post('/login', (req, res) => {
    // expects {username: 'Lernantino', password: 'password1234'}
    User.findOne({
      where: {
        userName: req.body.userName
      }
    }).then(async dbUserData => {
      if (!dbUserData) {
        res.status(400).json({ message: 'No user with that UserName!' });
        return;
      }
      console.log(dbUserData)
      //verify user
      const validPassword =  await dbUserData.checkPassword(req.body.password);
      
      if (!validPassword) {
        res.status(400).json({ message: 'Incorrect password!' });
        return;
      }
    
      req.session.save(() => {
        //declare session variables
        req.session.user_id = dbUserData.id;
        req.session.userName = dbUserData.userName;
        req.session.loggedIn = true;
      // console.log(req.session)
      // const { id, username } = dbUserData;
        res.json({user: dbUserData, message: `You are now logged in!` });
      });
    });
  });

  // Log out currently signed in user
  router.post('/logout', (req, res) => {
    if (req.session.loggedIn) {
      req.session.destroy(() => {
        res.status(204).end();
        res.json({ message: "you are now logged out!"});
      });
    }
    else {
      res.status(404).end();
    }
  });

module.exports = router;