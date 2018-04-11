import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content, Events} from 'ionic-angular';
import { RoomPage } from '../room/room';
import * as firebase from 'Firebase';
import {Camera , CameraOptions, DestinationType, EncodingType, MediaType} from '@ionic-native/camera'
import { DBMeter } from '@ionic-native/db-meter';
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers:[DBMeter]
})
export class HomePage {
  @ViewChild(Content) content: Content;
  data = { type:'', nickname:'', message:'' };
  chats = [];
  deci:any;
  camOptionsSet:boolean = false;
  cameraOptions:CameraOptions;
  private subscription:any;
  //camera:Camera;
  roomkey:string;
  nickname:string;
  offStatus:boolean = false;
  public imageToShow:any;
  isImageLoading:boolean = true;
  
  public photos : any;
  public base64Image : string;
  constructor(public navCtrl: NavController, public navParams: NavParams, private camera : Camera,private dbMeter: DBMeter) {
    this.UpdateDeci();

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
  UpdateDeci(){
    let subscription = this.dbMeter.start().subscribe(
      data => this.deci = data
      
    );
  }
  sendMessage() {
    
   this.data.message +=' '+ this.deci;
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
  
  logEvent(){
    const options : CameraOptions = {
      quality: 50, // picture quality
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }
    this.camera.getPicture(options).then((imageData) =>{
this.isImageLoading = true;
this.base64Image = "data:image/jpeg;base64," + imageData;
      this.photos.push(this.base64Image);
      this.photos.reverse();
this.isImageLoading = false;
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

