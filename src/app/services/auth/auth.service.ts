import { Injectable, NgZone } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { first, switchMap } from 'rxjs/operators';
import { Usuario } from 'src/app/clases/usuario';
import { firebaseUser } from 'src/app/interfaces/firebaseUser';
import { NotificationsService } from '../notifications/notifications.service';
import {Howl, Howler} from 'howler';
const {Howl, Howler} = require('howler');

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public user$: Observable<firebaseUser>;
  public loggedUser: firebaseUser;
  public dbRef: AngularFirestoreCollection<Usuario>

  constructor(
    public afStore: AngularFirestore,
    public ngFireAuth: AngularFireAuth,
    public router: Router,
    public ngZone: NgZone,
    public pushSrv: NotificationsService
  ) {
    this.user$ = this.ngFireAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.afStore.doc(`users/${user.uid}`).valueChanges();
        }
        return of(null);
      })
    );
    this.dbRef = this.afStore.collection("users");
  }

  SignIn(email, password) {
    return this.ngFireAuth.signInWithEmailAndPassword(email, password);
  }

  CreaterUser(email:string,password:string){
    return this.ngFireAuth.createUserWithEmailAndPassword(email,password);
  }
  
  PasswordRecover(passwordResetEmail) {
    return this.ngFireAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert(
          "Password reset email has been sent, please check your inbox."
        );
      })
      .catch(error => {
        window.alert(error);
      });
  }

  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem("userData"));
    return user !== null && user.emailVerified !== false ? true : false;
  }

  async SignOut(param?:boolean) {
    if(!param){
      var sound = new Howl({
        src: ['../assets/adios.mp3']
      });
    }
    
    sound.play();
    this.pushSrv.DeleteFCM();
    this.pushSrv.DeleteInstance();
    await this.ngFireAuth.signOut();
    localStorage.removeItem("userData");
    localStorage.removeItem("uid");  
  } 

  getCurrentUser(): Usuario{
    let user = JSON.parse(localStorage.getItem("userData"));
    return user;
  }

  getUid(): string{
    return localStorage.getItem("uid");
  }

  async deleteUser(){
    return (await this.ngFireAuth.currentUser).delete();
  }
}
