// Underscore extensions
_.dasherize = function(str) {
  return str.trim().replace(/[-_\s]+/g, '-');
};

jQuery(function($) {
  var BASE_FLAG_PATH = '/wp-content/plugins/pnp-livemap/img/flags/',
      HOST = '198.199.84.58';

  var map,
      pointsPromise,
      widget = $('.widget_pnp_wherewearewidget'),
      spinner = widget.find('.geo-spinner'),
      content = widget.find('.geo-content'),
      flag = content.find('.flag'),
      timestamp = content.find('time')
      placeText = content.find('.place-text'),
      distance = content.find('.distance'),
      minimap = content.find('.minimap'),
      mapContainer = widget.find('#pnp-fullmap');

  // Kick off the widget load
  $.ajax({ url: 'http://' + HOST + ':3000/points/recent' })
      .done(setupWidget)
      .fail(hideWidget);

  // Grab the points too, for distance calculation
  pointsPromise = $.ajax({ url: 'http://' + HOST + ':3000/points/reduced' })
      .done(showDistance);

  // Handle the minimap click to show the big map
  minimap.click(minimapClicked);

  function setupWidget(points) {
    minimap.attr('src', generateStaticMapUrl(points));
    timestamp.text(getTimestampText(_.last(points).ts));
    geocode(_.last(points), function(err, placeDetails) {
      if (err) {
        hideWidget();
      } else {
        spinner.hide();
        content.show();
        placeText.text(getPlaceText(placeDetails));
        flag.attr('src', toFlagSrc(placeDetails.country));
      }
    });
  }

  function toFlagSrc(country) {
    return BASE_FLAG_PATH + _.dasherize(country.replace(/The /ig, '')) + '.png'
  }

  function hideWidget() {
    widget.hide();
  }

  function minimapClicked() {
    if (!map) {
      pointsPromise.done(setupLargeMap).fail(showError);
    } else {
      showLargeMap();
    }
  }

  function showDistance(points) {
    var d = Math.ceil(computeDistanceInKm(points));
    distance.text(d + ' km').fadeIn();
  }

  function setupLargeMap(points) {
    mapContainer.show(); // allow it to get dimensions
    showLargeMap(); // lightboxify the container

    // Hackorific. :(
    _.delay(function() {
      map = new google.maps.Map(mapContainer.get(0), {
          center: _.last(points),
          zoom: 9,
          mapTypeControl: false,
          streetViewControl: false,
          mapTypeId: google.maps.MapTypeId.TERRAIN
        });
      map.fitBounds(computeBounds(points));
      plot(points);
    }, 500);
  }

  function showLargeMap() {
    mapContainer.lightbox_me({
      overlayCSS: { background: 'black', opacity: 0.7 }
    });
  }

  // Converts a LatLngLiteral ( { lat: Number, lng: Number } ) to
  // the API object.
  function toLatLng(pt) {
    return new google.maps.LatLng(pt.lat, pt.lng);
  }

  function computeBounds(points) {
    return _.chain(points)
            .map(toLatLng)
            .reduce(function(bounds, latLng) {
                return bounds.extend(latLng)
              }, new google.maps.LatLngBounds())
            .value();
  }

  function computeDistanceInKm(points) {
    return google.maps.geometry.spherical.computeLength(_.map(points, toLatLng)) / 1000;
  }

  function plot(points) {
    var poly = new google.maps.Polyline({
      path: points,
      geodesic: false,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      zIndex: 5000
    });
    poly.setMap(map);
  }

  function showError() {

  }

  function geocode(latLng, callback) {
    var geocoder = new google.maps.Geocoder();
    var extractComponent = function(addressComponents, type) {
      return _.find(addressComponents, function(comp) {
        return _.contains(comp.types, type)
      });
    };

    geocoder.geocode({ latLng: latLng }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var addressComponents = _.first(results).address_components;
        var country = extractComponent(addressComponents, 'country');
        var province = extractComponent(addressComponents, 'administrative_area_level_1');
        var locality = extractComponent(addressComponents, 'locality');

        callback(undefined, { locality: locality.long_name,
                              province: province,
                              country: country.long_name });
      } else {
        callback(status);
      }
    });
  }

  function getPlaceText(placeDetails) {
    if (placeDetails.locality) {
      return placeDetails.locality + ', ' + placeDetails.country;
    }
    else if (placeDetails.province) {
      return placeDetails.province + ', ' + placeDetails.country;
    }
    else {
      return placeDetails.country;
    }
  }

  function getTimestampText(unixTime) {
    var MONTH_NAMES = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec' ];

    var pad = function(number) {
      if (number == 0) {
        return '00';
      }
      else if (number < 10) {
        return '0' + number;
      }
      else {
        return '' + number;
      }
    };

    var hours = function(h) {
      if (h % 12 == 0) {
        return '12';
      } else {
        return h % 12;
      }
    };

    var daySuffix = function(d) {
      switch (d) {
        case 1: case 21: case 31:
          return 'st';
        case 2: case 22:
          return 'nd';
        case 3: case 23:
          return 'rd';
        default:
          return 'th';
      }
    }

    var amPm = function(h) {
      if (h < 12) {
        return 'am';
      } else {
        return 'pm';
      }
    };

    var dt = new Date(unixTime * 1000);

    return MONTH_NAMES[dt.getMonth()] + ' ' +
           dt.getDate() + daySuffix(dt.getDate()) + ', ' +
           hours(dt.getHours()) + ':' +
           pad(dt.getMinutes()) + amPm(dt.getHours());
  }

  function generateStaticMapUrl(points) {
    var ptToStr = function(pt) {
      return pt.lat + ',' + pt.lng;
    };

    var url = "http://maps.googleapis.com/maps/api/staticmap?";
    var center = ptToStr(_.last(points));
    var path = _.last(points, 30).map(ptToStr).join('|');

    var params = {
      center: center,
      markers: 'color:red|' + center,
      path: 'color:red|' + path,
      zoom: 9,
      scale: 2,
      size: '278x200',
      maptype: 'terrain',
      key: 'AIzaSyB4du1SngujDMVsO91yl14Q5rzmQp7eytM'
    };

    return url + $.param(params)
  }
});
