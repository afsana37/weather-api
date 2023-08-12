document.addEventListener('DOMContentLoaded', () => {
  const apiKey = 'enter your weather-api-key';
  const giphyApiKey = 'enter your giphy-api-key';
  const weatherForm = document.getElementById('locationForm');
  const locationInput = document.getElementById('locationInput');
  const weatherDataDiv = document.getElementById('weatherData');
  const unitToggleBtn = document.getElementById('unitToggle');
  let isCelsius = true;

  async function getWeatherData(location) {
    try {
      const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}`);
      if (!response.ok) {
        throw new Error('Unable to fetch weather data. Please try again later.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  function toggleUnits(current) {
    isCelsius = !isCelsius;
    const temperature = isCelsius ? current.temp_c : current.temp_f;
    const unitSymbol = isCelsius ? '°C' : '°F';
    weatherDataDiv.querySelector('.temperature').textContent = `${temperature} ${unitSymbol}`;
  }

  function showLoading() {
    weatherDataDiv.innerHTML = '<p>Loading...</p>';
  }

  async function getWeatherGif(weatherCondition) {
    return new Promise((resolve, reject) => {
      const giphyApiUrl = `https://api.giphy.com/v1/gifs/random?api_key=${giphyApiKey}&tag=${encodeURIComponent(weatherCondition)}&rating=g`;
      const script = document.createElement('script');
      script.src = `${giphyApiUrl}&callback=handleGiphyResponse`;
      document.body.appendChild(script);

      const timeout = setTimeout(() => {
        reject(new Error('Giphy API request timeout.'));
      }, 5000);

      window.handleGiphyResponse = (response) => {
        clearTimeout(timeout);
        document.body.removeChild(script);
        if (response && response.data && response.data.image_url) {
          resolve(response.data.image_url);
        } else {
          reject(new Error('Error fetching weather gif.'));
        }
      };
    });
  }

  async function displayWeatherData(weatherData) {
    if (!weatherData) {
      weatherDataDiv.innerHTML = '<p>Weather data not available. Please try again later.</p>';
      return;
    }

    const { location, current } = weatherData;
    const temperature = isCelsius ? current.temp_c : current.temp_f;
    const unitSymbol = isCelsius ? '°C' : '°F';
    const condition = current.condition.text;
    const iconURL = current.condition.icon;

    weatherDataDiv.innerHTML = `
      <h2>Weather in ${location.name}, ${location.country}</h2>
      <p class="temperature">${temperature} ${unitSymbol}</p>
      <p>${condition}</p>
      <img src="${iconURL}" alt="Weather Icon">
    `;

    try {
      const weatherGifURL = await getWeatherGif(condition);
      if (weatherGifURL) {
        const gifImg = document.createElement('img');
        gifImg.src = weatherGifURL;
        gifImg.alt = 'Weather Gif';
        gifImg.classList.add('weather-gif');
        weatherDataDiv.appendChild(gifImg);
      } else {
        weatherDataDiv.innerHTML += '<p>Weather gif could not be loaded.</p>';
      }
    } catch (error) {
      console.error('Error fetching weather gif:', error);
      weatherDataDiv.innerHTML += '<p>Weather gif could not be loaded.</p>';
    }
  }

  weatherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const location = locationInput.value.trim();
    if (location) {
      showLoading();
      const weatherData = await getWeatherData(location);
      localStorage.setItem('weatherData', JSON.stringify(weatherData));
      displayWeatherData(weatherData);
    }
  });

  unitToggleBtn.addEventListener('click', () => {
    const weatherData = JSON.parse(localStorage.getItem('weatherData'));
    if (weatherData) {
      toggleUnits(weatherData.current);
      displayWeatherData(weatherData);
    }
  });
});
