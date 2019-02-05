const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const { Schema } = mongoose;
mongoosePaginate.paginate.options = { limit: 3 };

const PetSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  species: {
    type: String,
    required: true,
  },
  birthday: {
    type: String,
    required: true,
  },
  picUrl: {
    type: String,
    required() {
      return this.avatarUrl == null;
    },
  },
  picUrlSq: {
    type: String,
    required() {
      return this.avatarUrl == null;
    },
  },
  avatarUrl: {
    type: String,
    // required: true
    required() {
      return this.picUrl == null;
    },
  },
  favoriteFood: {
    type: String,
    required: true,
  },
  description:{
    type: String,
    minlength: 100,
    required: true,
  },
  price: {
    type: Number,
    requireed: true,
  },
  purchasedAt: {
    type: Date,
  },
}, { timestamps: true });

PetSchema.plugin(mongoosePaginate);
PetSchema.index({
  name: 'text',
  species: 'text',
  favoriteFood: 'text',
  description: 'text',
}, {
  name: 'My text index',
  weights: {
    name: 10,
    species: 4,
    favoriteFood: 2,
    description: 1,
  },
});

module.exports = mongoose.model('Pet', PetSchema);
