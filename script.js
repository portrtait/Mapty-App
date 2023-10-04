'use strict';

// Building class Workout (is parent)
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // id = last 10 digits of the date

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  // A title of the workout (in list and on marker)
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // = 'Running on August 31'
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// Building Running workout
class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    // List of initial parameters
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Building Cycling workout
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    // List of initial parameters

    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// temp to check whether our classes above work
// const run1 = new Running([39, 21], 5.2, 24, 178);
// const cycling1 = new Cycling([39, 22], 27, 95, 523);
// console.log(run1, cycling1);

///////////////////////////
// APPLICATION ARCHITECTURE

// Selecting elements
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 15;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    // Submit form => display marker for the new workout at that spot
    form.addEventListener('submit', this._newWorkout.bind(this));

    // Change option => toggle button between 'running' and 'cycling'
    inputType.addEventListener('change', this._toggleElevationField);

    // Click on a workout => show that workout at the center of the map
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
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

  // Load map to display
  _loadMap(position) {
    // temp check
    // console.log(position.coords);

    // 1. Derive latitude and longitude from current GPS location
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(
      `Here's your coordinates: https://www.google.com/maps/@${latitude},${longitude}`
    );

    // 2. Collect current location into one array in a given format
    const coords = [latitude, longitude];
    // console.log(coords);

    // temp check to see what's inside 'this' - should be App object
    // console.log(this);

    // 3. Leaflet Code: shows my exact position on map
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // 3.1 Visual settings of the map
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // 4. Click on map => show form to fill (and show marker after submitting)
    this.#map.on('click', this._showForm.bind(this));

    // 5. Recreate markers from local storage, if there are any. For every workout from #workouts array via loop (retrieved from local storage)
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    // We save the event (to use its coordinates) because we will need access to it in a different function
    this.#mapEvent = mapE;

    // Show the form (it was hidden)
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';

    // Visually beautiful appear/disappear of the form
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
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
    // console.log(duration);

    // Get the coords of the clicked area
    const { lat, lng } = this.#mapEvent.latlng;
    console.log(`Workout at {${lat}, ${lng}}`);
    let workout;

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // console.log(cadence);

      // Check if data is valid - if not, return an alert
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      // Create workout object running
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // console.log(elevation);

      // Check if data is valid - if not, return an alert
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      // Create workout object cycling
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);
    console.log(this.#workouts);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields immediately after submit
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  // Render workout on map as marker - function definition
  _renderWorkoutMarker(workout) {
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
      .setPopupContent(
        `${workout.type === 'running' ? ' 🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  // Render workout itema in the sidebar list
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? ' 🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  // Show the clicked workout at the center of the map
  _moveToPopup(e) {
    // 1. Determine which workout to handle:  identifies the closest (parent) element whose classname is '.workout'
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);

    // 1.1 If no such clicked workout exists, return
    if (!workoutEl) return;

    // 2. Determine whether the same workout exists in the (private) array of our workouts. This is done by comparing the IDs of the two workouts. If exists, return into a variable.
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    // 3. Go to this workout on map = center map around this workout
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  // Saves workouts in local storage
  _setLocalStorage() {
    // Saves key-value pair: 'workouts' is key and value is object array converted into a string
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  // Retrieves workouts from the local storage
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    if (!data) return;

    // Refill #workouts from stuff from local storage
    this.#workouts = data;

    // Create a list item in the sidebar for each element from #workouts array
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  // The only public method = clears local storage, thus clears list and the map from all workouts
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

// Creating object of App class
const app = new App();
