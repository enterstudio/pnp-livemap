// Underscore extensions
_.dasherize = function(str) {
  return str.trim().replace(/[-_\s]+/g, '-');
};

jQuery(function($) {
  var BASE_FLAG_PATH = '/wp-content/plugins/pnp-livemap/img/flags/',
      HOST = 'localhost',
      MONTH_NAMES = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec' ]; // 198.199.84.58

  var widget = $('.widget_pnp_wherewearewidget'),
      spinner = widget.find('.geo-spinner'),
      content = widget.find('.geo-content'),
      flag = content.find('.flag'),
      timestamp = content.find('time')
      placeText = content.find('.place-text'),
      minimap = content.find('.minimap');

  $.ajax({ url: 'http://' + HOST + ':3000/points/recent' })
      .done(setupWidget)
      .fail(hideWidget);

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
        flag.attr('src', BASE_FLAG_PATH + _.dasherize(placeDetails.country) + '.png');
      }
    });

    // map.setCenter(_.last(points));
    // geocode(_.last(points));
    // plot(reducePoints(points));
  }

  function hideWidget() {
    widget.hide();
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
    // Fuck this is ugly...in my defense it's a copy and paste job cause I'm laaazzy.
    var pad = function(number, digits) {
      return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
    };

    var hours = function(h) {
      if (h % 12 == 0) {
        return '12';
      } else {
        return h % 12;
      }
    };

    var dayPostfix = function(d) {
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
           dt.getDate() + dayPostfix(dt.getDate()) + ', ' +
           hours(dt.getHours()) + ':' +
           pad(dt.getMinutes(), 2) + amPm(dt.getHours());
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
      zoom: 14,
      scale: 2,
      size: '278x200',
      maptype: 'terrain',
      key: 'AIzaSyB4du1SngujDMVsO91yl14Q5rzmQp7eytM'
    };

    return url + $.param(params)
  }
});

// function getRecentPoints(callback) {
//   $.ajax({
//     url: '/points.json'
//   }).done(function(points) {
//     map.setCenter(_.last(points));
//     geocode(_.last(points));
//     plot(reducePoints(points));
//     console.log(generateStaticMapUrl(reducePoints(points)));
//   }).fail(function() {
//     console.log('fail', arguments)
//   });
// }

// $(function() {
//   var mapOptions = {
//     center: new google.maps.LatLng(-34.397, 150.644),
//     zoom: 8
//   };
//   var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);


//   var plot = function(points) {
//     var poly = new google.maps.Polyline({
//       path: points,
//       geodesic: false,
//       strokeColor: '#FF0000',
//       strokeOpacity: 1.0,
//       strokeWeight: 2
//     });
//     poly.setMap(map);
//   };

//   $.ajax({
//     url: '/points.json'
//   }).done(function(points) {
//     map.setCenter(_.last(points));
//     geocode(_.last(points));
//     plot(reducePoints(points));
//     console.log(generateStaticMapUrl(reducePoints(points)));
//   }).fail(function() {
//     console.log('fail', arguments)
//   });
// });