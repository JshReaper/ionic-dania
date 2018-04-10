import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content } from 'ionic-angular';
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
  public image:any;
  cameraOptions:CameraOptions;
  //camera:Camera;
  roomkey:string;
  nickname:string;
  offStatus:boolean = false;
  imageToShow:any;
  isImageLoading:boolean;

  constructor(public navCtrl: NavController, public navParams: NavParams, private camera : Camera) {

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
  ngOnInit() {
    this.image = [];
  }
  logEvent(){
    const options : CameraOptions = {
      quality: 50, // picture quality
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }
    this.camera.getPicture(this.cameraOptions).then(function(imageData){
      this.imageToShow = imageData;

    },function(err){
      console.log(err);
    });
    
    console.log("Camera button event detected");
  }
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

