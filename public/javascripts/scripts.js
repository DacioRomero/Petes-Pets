var form = document.getElementById('new-pet');
var alert = document.getElementById('alert');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    var pet = new FormData(form);

    axios.post('/pets', pet, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((response) => {
      console.log(response)
      window.location.replace(`/pets/${response.data.pet._id}`);
    })
    .catch((error) => {
      console.log(error.response)
      alert.classList.add('alert-warning');
      alert.textContent = 'Oops, something went wrong saving your pet. Please check your information and try again.';
      alert.style.display = 'block';

      setTimeout(() => {
        alert.style.display = 'none';
        alert.classList.remove('alert-warning');
      }, 3000);
    });
  });
}
