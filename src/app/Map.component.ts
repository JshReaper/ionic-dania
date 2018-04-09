import { Component } from '@angular/core';
declare const google: any;

export class MapComponent {
  lat;
  lng;
  address;

  constructor() {
    this.locate();
  }

  public locate() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.lat = position.coords.latitude; // Works fine
          this.lng = position.coords.longitude;  // Works fine

          let geocoder = new google.maps.Geocoder();
          let latlng = new google.maps.LatLng(this.lat, this.lng);
          let request = {
            latLng: latlng
          };

          geocoder.geocode(request, (results, status) => {
            if (status == google.maps.GeocoderStatus.OK) {
              if (results[0] != null) {
                this.address = results[0].formatted_address;  //<<<=== DOES NOT WORK, when I output this {{ address }} in the html, it's empty
                console.log(this.address);  //<<<=== BUT here it Prints the correct value to the console !!!
              } else {
                alert("No address available");
              }
            }
          });
        },
        error => {
          console.log("Error code: " + error.code + "<br /> Error message: " + error.message);
        }
      );
    }
  }
}