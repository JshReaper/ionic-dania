import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content, AlertController } from 'ionic-angular';
import { RoomPage } from '../room/room';
import * as firebase from 'Firebase';
import {Camera , CameraOptions, DestinationType, EncodingType, MediaType} from '@ionic-native/camera'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild(Content) content: Content;
  data = { type:'', nickname:'', message:'' };
  chats = [];
  camOptionsSet:boolean = false;
  cameraOptions:CameraOptions;
  //camera:Camera;
  roomkey:string;
  nickname:string;
  offStatus:boolean = false;
  public imageToShow:any;
  isImageLoading:boolean = true;
  alertCtrl : AlertController;

  public photos : any;
  public base64Image : string;
  constructor(public navCtrl: NavController, public navParams: NavParams, private camera : Camera, alertCtrl:AlertController) {
    this.alertCtrl = alertCtrl;
    this.roomkey = this.navParams.get("key") as string;
    this.nickname = this.navParams.get("nickname") as string;
    this.data.type = 'message';
    this.data.nickname = this.nickname;
  
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
    let newData = firebase.database().ref('chatrooms/'+this.roomkey+'/chats').push();
    newData.set({
      type:this.data.type,
      user:this.data.nickname,
      message:this.data.message,
      sendDate:Date()
    });
    this.data.message = '';
    this.imageToShow = '';
  }
  sendPicture() {
    let newData = firebase.database().ref('chatrooms/'+this.roomkey+'/chats').push();
    newData.set({
      type:this.data.type,
      user:this.data.nickname,
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
  
  logEvent(){
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

  upload(){
    let storageRef = firebase.storage().ref();

    //timestamp as filename
    const fileName = Math.floor(Date.now() / 1000);

    //creating a reffrence to images/todays-date.jpg
    const imageRef = storageRef.child('images/${filename}.jpg');

    imageRef.putString(this.base64Image, firebase.storage.StringFormat.DATA_URL).then((snapshot)=>{

      //succesful upload
      this.showSuccesfulUploadAlert();

    });
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

