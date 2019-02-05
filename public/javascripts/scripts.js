/* globals axios */
var form = document.getElementById('new-pet');
var alert = document.getElementById('alert');

if (form) {
  form.addEventListener('submit', function submitHandler(e) {
    var pet = new FormData(form);
    e.preventDefault();

    axios.post('/pets', pet, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(function postHandler(response) {
      window.location.replace('/pets/' + response.data.pet._id);
    }).catch(function addWarning() {
      alert.classList.add('alert-warning');
      alert.textContent = 'Oops, something went wrong saving your pet. Please check your information and try again.';
      alert.style.display = 'block';

      setTimeout(function removeWarning() {
        alert.style.display = 'none';
        alert.classList.remove('alert-warning');
      }, 3000);
    });
  });
}
