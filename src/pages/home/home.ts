import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content , AlertController} from 'ionic-angular';
import { RoomPage } from '../room/room';
import * as firebase from 'Firebase';
import {Camera , CameraOptions, DestinationType, EncodingType, MediaType} from '@ionic-native/camera'
import { Message } from '@angular/compiler/src/i18n/i18n_ast';
declare const google: any;


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild(Content) content: Content;
  lat;
  lng;
  address;

  data = { type:'', nickname:'', message:'' };
  chats = [];
  camOptionsSet:boolean = false;
  cameraOptions:CameraOptions;
  roomkey:string;
  nickname:string;
  offStatus:boolean = false;
  public imageToShow:any;
  isImageLoading:boolean = true;
 alertCtrl: AlertController;
  public photos : any;
  public base64Image : string;
  constructor(public navCtrl: NavController, public navParams: NavParams, private camera : Camera, AlertCtrl : AlertController) {

    this.roomkey = this.navParams.get("key") as string;
    this.nickname = this.navParams.get("nickname") as string;
    this.data.type = 'message';
    this.data.nickname = this.nickname;
    this.alertCtrl = AlertCtrl;
  
    let joinData = firebase.database().ref('chatrooms/'+this.roomkey+'/chats').push();
    joinData.set({
      type:'join',
      user:this.nickname,
      message:this.nickname+' has joined this room.',
      sendDate:Date()
    });
    this.data.message = '';
  
    firebase.database().ref('chatrooms/'+this.roomkey+'/chats').on('value', resp => {
      this.chats = [];
      this.chats = snapshotToArray(resp);
      setTimeout(() => {
        if(this.offStatus === false) {
          this.content.scrollToBottom(300);
        }
      }, 1000);
    });
  }
  ngOnInit() {
    this.photos = [];
  }
  sendMessage() {
    if(this.data.message != ""){
      let newData = firebase.database().ref('chatrooms/'+this.roomkey+'/chats').push();
      newData.set({
        type:this.data.type,
        user:this.data.nickname,
        message:this.data.message,
        hasPicture:false,
        sendDate:Date()
      });
      this.data.message = '';
    }
  }
  sendPicture(imageURL:string) {
    let newData = firebase.database().ref('chatrooms/'+this.roomkey+'/chats').push();
    newData.set({
      type:this.data.type,
      user:this.data.nickname,
      hasPicture:true,
      picture:imageURL,
      sendDate:Date()
    });
    this.data.message = '';
    this.imageToShow = '';
  }
  exitChat() {
    let exitData = firebase.database().ref('chatrooms/'+this.roomkey+'/chats').push();
    exitData.set({
      type:'exit',
      user:this.nickname,
      message:this.nickname+' has exited this room.',
      sendDate:Date()
    });
  
    this.offStatus = true;
  
    this.navCtrl.setRoot(RoomPage, {
      nickname:this.nickname
    });
  }
  
  cameraButton(){
    const options : CameraOptions = {
      quality: 50, // picture quality
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }
    this.camera.getPicture(options).then((imageData) =>{;
    let imageBlob = this.dataURItoBlob('data:image/jpeg;base64,' + imageData);
    if(imageBlob)
    this.upload(imageBlob);
    },function(err){
      console.log(err);
    });
    
    console.log("Camera button event detected");
  }
  dataURItoBlob(dataURI) {
    // code adapted from: http://stackoverflow.com/questions/33486352/cant-upload-image-to-aws-s3-from-ionic-camera
    let binary = atob(dataURI.split(',')[1]);
    let array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
  };

  Locate() {
    if (navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        position => {
          this.lat = position.coords.latitude; // Works fine
          this.lng = position.coords.longitude;  // Works fine

          let geocoder = new google.maps.Geocoder();
          let latlng = new google.maps.LatLng(this.lat, this.lng);
          let request = { latLng: latlng };

          console.log(position);
          geocoder.geocode(request, (results, status) => {
            if (status == google.maps.GeocoderStatus.OK) {
              if (results[0] != null) {
                this.data.message = results[0].street_address;  //<<<=== DOES NOT WORK, when I output this {{ address }} in the html, it's empty
                console.log(results[0].street_address);   //<<<=== BUT here it Prints the correct value to the console !!!
              } else {
                console.log("No address available");
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

  upload(imageData){
    let storageRef = firebase.storage().ref();
 
    //timestamp as filename
    const fileName = Math.floor(Date.now() / 1000);

    var uploadTask = firebase.storage().ref().child('images/' + fileName + '.jpg').put(imageData);

    console.log(uploadTask.snapshot.downloadURL);

    uploadTask.then(this.showSuccesfulUploadAlert, this.showFailedUploadAlert);

    var storage = firebase.storage();
    var pathRefrence = storage.refFromURL('gs://ionic-dania.appspot.com/'+'images/' + fileName + '.jpg');
    
    var string = pathRefrence.child('images/' + fileName + '.jpg').getDownloadURL().then((url) =>{
      console.log(url);
      //this.sendPicture(url);
    });
    console.log(string);
      //succesful upload

    
   
    
  };
  showFailedUploadAlert = (imageURL)=>{
    let alert = this.alertCtrl.create({
      title: 'Upload failed..',
      buttons: ['OK']
    });
    alert.present();
  }

  showSuccesfulUploadAlert = (snapshot) => {
    let alert = this.alertCtrl.create({
      title: 'Picture posted',
      subTitle: 'Picture was successfully posted!',
      buttons: ['OK']
    });
    alert.present();
    // clear the previous photo data in the variable
    this.base64Image = "";
  };

};

export const snapshotToArray = snapshot => {
  let returnArr = [];

  snapshot.forEach(childSnapshot => {
      let item = childSnapshot.val();
      item.key = childSnapshot.key;
      returnArr.push(item);
  });

  return returnArr;
};