// MODELS
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const stripe = require('stripe')(process.env.PRIVATE_STRIPE_API_KEY);
const Pet = require('../models/pet');

// UPLOADING TO AWS S3
const upload = multer({ dest: 'uploads/' });
const Upload = require('s3-uploader');

const client = new Upload(process.env.S3_BUCKET, {
  aws: {
    path: 'pets/avatar',
    region: process.env.S3_REGION,
    acl: 'public-read',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  cleanup: {
    versions: true,
    original: true
  },
  versions: [
    {
      maxWidth: 400,
      aspect: '16:10',
      suffix: '-standard'
    },
    {
      maxWidth: 300,
      aspect: '1:1',
      suffix: '-square'
    }
  ]
});

const nodemailerMailgun = nodemailer.createTransport(mg({
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.EMAIL_DOMAIN
  }
}));

// PET ROUTES
module.exports = (app) => {
  // INDEX PET => index.js

  // NEW PET
  app.get('/pets/new', (req, res) => {
    res.render('pets-new');
  });

  // CREATE PET
  app.post('/pets', upload.single('avatar'), asyncHandler(async (req, res) => {
    const pet = new Pet(req.body);

    if(req.file) {
      client.upload(req.file.path, {}, function(err, versions, meta) {
        if (err) throw err;

        const image = versions[0];

        const urlArray = image.url.split('-');
        urlArray.pop();

        pet.avatarUrl = urlArray.join('-');
      });
    }

    await pet.save();

    res.send({ pet });
  }));

  // SHOW PET
  app.get('/pets/:id', asyncHandler(async (req, res) => {
    const pet = await Pet.findById(req.params.id);

    if (req.header('content-type') == 'application/json') {
      res.send({ pet });
    } else {
      res.render('pets-show', { pet });
    }
  }));

  // EDIT PET
  app.get('/pets/:id/edit', asyncHandler(async (req, res) => {
    const pet = await Pet.findById(req.params.id);

    res.render('pets-edit', { pet: pet });
  }));

  // UPDATE PET
  app.put('/pets/:id', asyncHandler(async (req, res) => {
    const pet = await Pet.findByIdAndUpdate(req.params.id, req.body);

    if (req.header('content-type') == 'application/json') {
      res.json({ pet })
    } else {
      res.redirect(`/pets/${pet._id}`)
    }
  }));

  // DELETE PET
  app.delete('/pets/:id', asyncHandler(async (req, res) => {
    const pet = await Pet.findByIdAndRemove(req.params.id);

    if (req.header('content-type') == 'application/json') {
      res.json({ pet })
    } else {
      res.redirect('/')
    }
  }));

  app.post('/pets/:id/purchase', asyncHandler(async (req, res) => {
    const token = req.body.stripeToken;

    const petId = req.body.petId || req.params.id;

    const pet = await Pet.findById(petId);

    const charge = await stripe.charges.create({
      amount: pet.price * 100,
      currency: 'usd',
      description: `Purchased ${pet.name}, ${pet.species}`,
      source: token,
    });

    const user = {
      email: req.body.stripeEmail,
      amount: charge.amount / 100,
      petName: pet.name
    };

    pet.purchasedAt = Date.now();

    Promise.all([
      await pet.save({ validateBeforeSave: false }),
      await nodemailerMailgun.sendMail({
        from: 'no-reply@example.com',
        to: user.email,
        subject: 'Pet Purchased!',
        template: {
          name: 'email.handlebars',
          engine: 'handlebars',
          context: user
        }
      })
    ]);

    if (req.header('content-type') == 'application/json') {
      res.json({ pet });
    } else {
      res.redirect(`/pets/${pet._id}`);
    }
  }));

  app.get('/search', asyncHandler(async (req, res) => {
    const page = req.query.page || 1;

    const results = await Pet.paginate({
      $text: { $search: req.query.term }
    }, {
      select: { score: { $meta: 'textScore' }},
      sort: { score: { $meta: 'textScore' } },
      page
    });

    const body = {
      pets: results.docs,
      pagesCount: results.pages,
      currentPage: page,
      term: req.query.term
    };

    if (req.header('content-type') == 'application/json')  {
      res.json(body);
    } else {
      res.render('pets-index', body);
    }
  }));
}
