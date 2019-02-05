// MODELS
const express = require('express');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const Upload = require('s3-uploader');
const stripe = require('stripe')(process.env.PRIVATE_STRIPE_API_KEY);
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const Pet = require('../models/pet');

// UPLOADING TO AWS S3
const upload = multer({ dest: 'uploads/' });

const client = new Upload(process.env.S3_BUCKET, {
  aws: {
    path: 'pets/avatar',
    region: process.env.S3_REGION,
    acl: 'public-read',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  cleanup: {
    versions: true,
    original: true,
  },
  versions: [
    {
      maxWidth: 400,
      aspect: '16:10',
      suffix: '-standard',
    },
    {
      maxWidth: 300,
      aspect: '1:1',
      suffix: '-square',
    },
  ],
});

const nodemailerMailgun = nodemailer.createTransport(mg({
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.EMAIL_DOMAIN,
  },
}));

const router = express.Router();

// PET ROUTES
// INDEX PET => index.js

// CREATE PET
router.post('/', upload.single('avatar'), asyncHandler(async (req, res) => {
  const pet = new Pet(req.body);

  async function saveAndSend() {
    await pet.save();
    res.json({ pet });
  }

  if (req.file) {
    client.upload(req.file.path, {}, (err, versions) => {
      if (err) throw err;

      const image = versions[0];

      const urlArray = image.url.split('-');
      urlArray.pop();

      pet.avatarUrl = urlArray.join('-');

      saveAndSend();
    });
  } else {
    saveAndSend();
  }
}));

// NEW PET
router.get('/new', (req, res) => {
  res.render('pets-new');
});

// SEARCH PET
router.get('/search', asyncHandler(async (req, res) => {
  const page = req.query.page || 1;

  const results = await Pet.paginate({
    $text: { $search: req.query.term },
  }, {
    select: { score: { $meta: 'textScore' } },
    sort: { score: { $meta: 'textScore' } },
    page,
  });

  const body = {
    pets: results.docs,
    pagesCount: results.pages,
    currentPage: page,
    term: req.query.term,
  };

  res.format({
    html() {
      res.render('pets-index', body);
    },
    json() {
      res.json(body);
    },
  });
}));

// SHOW PET
router.get('/:id', asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);

  res.format({
    html() {
      res.render('pets-show', { pet });
    },
    json() {
      res.json({ pet });
    },
  });
}));

// EDIT PET
router.get('/:id/edit', asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);

  res.render('pets-edit', { pet });
}));

// UPDATE PET
router.put('/:id', asyncHandler(async (req, res) => {
  const pet = await Pet.findByIdAndUpdate(req.params.id, req.body);

  res.format({
    html() {
      res.redirect(`/pets/${pet._id}`);
    },
    json() {
      res.json({ pet });
    },
  });
}));

// DELETE PET
router.delete('/:id', asyncHandler(async (req, res) => {
  const pet = await Pet.findByIdAndRemove(req.params.id);

  res.format({
    html() {
      res.redirect('/');
    },
    json() {
      res.json({ pet });
    },
  });
}));

// PURCHASE PET
router.post('/:id/purchase', asyncHandler(async (req, res) => {
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
    petName: pet.name,
  };

  pet.purchasedAt = Date.now();

  Promise.all([
    await pet.save(),
    await nodemailerMailgun.sendMail({
      from: 'no-reply@example.com',
      to: user.email,
      subject: 'Pet Purchased!',
      template: {
        name: 'email.handlebars',
        engine: 'handlebars',
        context: user,
      },
    }),
  ]);

  res.format({
    html() {
      res.redirect(`/pets/${pet._id}`);
    },
    json() {
      res.json({ pet });
    },
  });
}));

module.exports = router;
