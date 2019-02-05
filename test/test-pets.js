/* global describe it after */
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const Pet = require('../models/pet');

chai.should();

const fido = {
  name: 'Norman',
  species: 'Greyhound',
  birthday: '2008-11-11',
  favoriteFood: 'Liver',
  picUrl: 'http://www.gpamass.com/s/img/emotionheader713297504.jpg',
  picUrlSq: 'https://www.collinsdictionary.com/images/thumb/greyhound_21701074_250.jpg',
  description: 'Fido is a dog and he\'s a good dog who loves to play and hang out with his owners. He also likes to nap and enjoys eating dog food',
};

chai.use(chaiHttp);

describe('Pets', () => {
  after(async () => {
    await Pet.remove({ $or: [{ name: 'Norman' }, { name: 'Spider' }] });
  });

  // TEST INDEX
  // HTML
  it('should index ALL pets on / GET as HTML', async () => {
    const res = await chai.request(server)
      .get('/');

    res.should.have.status(200);
    res.should.be.html;
  });
  // JSON
  it('should index ALL pets on / GET as JSON', async () => {
    const res = await chai.request(server)
      .get('/')
      .set('Accept', 'application/json');

    res.should.have.status(200);
    res.should.be.json;
  });

  // TEST NEW
  it('should display new form on /pets/new GET as HTML', async () => {
    const res = await chai.request(server)
      .get('/pets/new');

    res.should.have.status(200);
    res.should.be.html;
  });

  // TEST CREATE
  it('should create a SINGLE pet on /pets POST as JSON', async () => {
    const res = await chai.request(server)
      .post('/pets')
      .set('Accept', 'application/json')
      .send(fido);

    res.should.have.status(200);
    res.should.be.json;
  });


  // TEST SHOW
  // HTML
  it('should show a SINGLE pet on /pets/<id> GET as HTML', async () => {
    const pet = await Pet.create(fido);

    const res = await chai.request(server)
      .get(`/pets/${pet._id}`);

    res.should.have.status(200);
    res.should.be.html;
  });
  // JSON
  it('should show a SINGLE pet on /pets/<id> GET as JSON', async () => {
    const pet = await Pet.create(fido);

    const res = await chai.request(server)
      .get(`/pets/${pet._id}`)
      .set('Accept', 'application/json');

    res.should.have.status(200);
    res.should.be.json;
  });

  // TEST EDIT
  it('should edit a SINGLE pet on /pets/<id>/edit GET', async () => {
    const pet = await Pet.create(fido);

    const res = await chai.request(server)
      .get(`/pets/${pet._id}/edit`)

    res.should.have.status(200);
    res.should.be.html;
  });


  // TEST UPDATE
  // HTML
  it('should update a SINGLE pet on /pets/<id> PUT as HTML', async () => {
    const pet = await Pet.create(fido);

    const res = await chai.request(server)
      .put(`/pets/${pet._id}`)
      .send({ name: 'Spider' });

    res.should.have.status(200);
    res.should.be.html;
  });
  // JSON
  it('should update a SINGLE pet on /pets/<id> PUT as JSON', async () => {
    const pet = await Pet.create(fido);

    const res = await chai.request(server)
      .put(`/pets/${pet._id}`)
      .set('Accept', 'application/json')
      .send({ name: 'Spider' });

    res.should.have.status(200);
    res.should.be.json;
  });

  // TEST DELETE
  // HTML
  it('should delete a SINGLE pet on /pets/<id> DELETE as HTML', async () => {
    const pet = await Pet.create(fido);

    const res = await chai.request(server)
      .delete(`/pets/${pet._id}`);

    res.should.have.status(200);
    res.should.be.html;
  });
  // JSON
  it('should delete a SINGLE pet on /pets/<id> DELETE as JSON', async () => {
    const pet = await Pet.create(fido);

    const res = await chai.request(server)
      .delete(`/pets/${pet._id}`)
      .set('Accept', 'application/json');

    res.should.have.status(200);
    res.should.be.json;
  });

  // TEST Search
  // HTML
  it('should search ALL pets by name or species on /search GET as HTML', async () => {
    const res = await chai.request(server)
      .get('/pets/search?term=norman');

    res.should.have.status(200);
    res.should.be.html;
  });
  // JSON
  it('should search ALL pets by name or species on /search GET as JSON', async () => {
    const res = await chai.request(server)
      .get('/pets/search?term=norman')
      .set('Accept', 'application/json');

    res.should.have.status(200);
    res.should.be.json;
  });
});
