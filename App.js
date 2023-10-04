'use strict';
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();

    // Submit form => display marker for the new workout at that spot
    form.addEventListener('submit', this._newWorkout.bind(this));

    // Change option => toggle button between 'running' and 'cycling'
    inputType.addEventListener('change', this._toggleElevationField);
  }

  // Getting the position from GPS
  _getPosition() {
    // Check whether browser allowed access to geolocation
    if (navigator.geolocation) {
      // 1. Getting current position
      navigator.geolocation.getCurrentPosition(
        // 1.1. When access to location is permissed => load map to display map
        this._loadMap.bind(this),

        // 1.2. When access to location is denied => alert
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  // 1.1. When access to location is permissed => load map to display
  _loadMap(position) {
    // temp check
    // console.log(position.coords);
    // Derive latitude and longitude from current GPS location
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(
      `Here's your coordinates: https://www.google.com/maps/@${latitude},${longitude}`
    );

    // Collect current location into one array
    const coords = [latitude, longitude];
    // console.log(coords);
    // temp check to see what's inside 'this' - should be App object
    // console.log(this);
    // [start] Leaflet Code: shows my exact position
    this.#map = L.map('map').setView(coords, 15);

    // Visual settings of the map
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Click on map => show form to fill (and show marker after submitting)
    this.#map.on('click', this._showForm.bind(this));

    // [end] Leaflet code
  }

  _showForm(mapE) {
    // We save the event (to use its coordinates) because we will need access to it in a different function
    this.#mapEvent = mapE;

    // Show the form (it was hidden)
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // Toggle input parameters between 'running' and 'cycling'
  _toggleElevationField() {
    // in both lines below we toggle a class in the closest parent with class name '.form-row'
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // validInputs() converts all parameters into an array and checks whether every array item is a finite number. Returns true only if all are finite numbers. Returns false if any one of those parameters is not a finite number.
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // prevents default behavior which is reloading the page. We don't need it.
    e.preventDefault();

    // Get data from form
    // We use '+' because we want input values to be numbers, i.e. we numberify them
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // temp: check the values
    // console.log(type);
    // console.log(distance);
    console.log(duration);

    // Get the coords of the clicked area
    const { lat, lng } = this.#mapEvent.latlng;
    console.log(`Workout at {${lat}, ${lng}}`);
    let workout;

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      console.log(cadence);

      // Check if data is valid - if not, return an alert
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      console.log(elevation);

      // Check if data is valid - if not, return an alert
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    // Render workout on map as marker
    this.renderWorkoutMarker(workout);

    // Render workout on list
    // Hide form + clear input fields immediately after submit
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
  }

  // Render workout on map as marker - function definition
  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent('hhhuh')
      .openPopup();
  }
}
