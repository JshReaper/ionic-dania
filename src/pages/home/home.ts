import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content , AlertController, Events} from 'ionic-angular';
import { RoomPage } from '../room/room';
import * as firebase from 'Firebase';
import {Camera , CameraOptions, DestinationType, EncodingType, MediaType} from '@ionic-native/camera'
import { Message } from '@angular/compiler/src/i18n/i18n_ast';
import { DBMeter } from '@ionic-native/db-meter'
declare const google: any;


@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers:[DBMeter]
})
export class HomePage {
  @ViewChild(Content) content: Content;
  lat;
  lng;

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

  private dbMeter;
  private subscription: any;
  public deci = 'test';

  public photos : any;
  public base64Image : string;
  constructor(public navCtrl: NavController, public navParams: NavParams, private camera : Camera, AlertCtrl : AlertController, dbMeter: DBMeter) {
    this.roomkey = this.navParams.get("key") as string;
    this.nickname = this.navParams.get("nickname") as string;
    this.data.type = 'message';
    this.data.nickname = this.nickname;
    this.alertCtrl = AlertCtrl;
    this.dbMeter = dbMeter;
  
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
  UpdateDeci(){
    let subscription = this.dbMeter.start().subscribe(
      data => this.deci = data
    );
    
  }
  sendMessage() {
    if (this.data.message != ""){
      this.UpdateDeci();
      this.data.message +=' '+ this.deci;
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
  sendPicture() {
    let newData = firebase.database().ref('chatrooms/'+this.roomkey+'/chats').push();
     newData.set({
        type:this.data.type,
        user:this.data.nickname,
        hasPicture:true,
        picture:this.base64Image,
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
    this.camera.getPicture(this.cameraOptions).then((imageData) =>{
    this.isImageLoading = true;
    this.base64Image = "data:image/jpeg;base64," + imageData;
    this.upload();
    this.isImageLoading = false;
    },function(err){
      console.log(err);
    });
    
    console.log("Camera button event detected");
  }

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

  upload(){
    let storageRef = firebase.storage().ref();
 
    //timestamp as filename
    const fileName = Math.floor(Date.now() / 1000);

    //creating a reference to images/todays-date.jpg
    const imageRef = storageRef.child('images/${filename}.jpg');

    //imageRef.putString(this.base64Image, firebase.storage.StringFormat.DATA_URL).then((snapshot)=>{

      //succesful upload
      this.showSuccesfulUploadAlert();

    //});
    
  };

  showSuccesfulUploadAlert() {
    let alert = this.alertCtrl.create({
      title: 'Picture posted',
      subTitle: 'Picture was successfully posted!',
      buttons: ['OK']
    });
    alert.present();
    this.sendPicture();
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