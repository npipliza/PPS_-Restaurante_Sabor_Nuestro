import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
  Channel
} from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../auth/auth.service';
import { eRol } from 'src/app/enums/eRol';
import { eEmpleado } from 'src/app/enums/eEmpleado';
import { eTipoMesa } from 'src/app/enums/eTipoMesa';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  msj: Channel;
  device_token;
  group: string;
  constructor(public http: HttpClient,private toastController : ToastController, private auth: AuthService) { 

  }

  public InitPush() {
    if (Capacitor.getPlatform() !== 'web') {
      this.setGroup()
      this.RegisterPush();
      this.RegisterFCM();
      this.SubcribeToTopic(this.group);
    }
  }

  public setGroup(){
    let currentUser = JSON.parse(localStorage.getItem("userData"));
    let rol = currentUser.rol;
    if (rol == eRol.DUEÑO || rol == eRol.SUPERVISOR) {
      this.group = 'supervisor'
    } else {
      switch (currentUser.tipo_empleado) {
        case eEmpleado.MOZO:
          this.group = 'mozo'
          break;
        case eEmpleado.BARTENDER:
          this.group = 'bar'
          break;
        case eEmpleado.COCINERO:
          this.group = 'cocina'
          break;
      }
    }
  }

  private RegisterPush() {

    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      } else {      }
    });

    PushNotifications.addListener('registration',
      (token: Token) => {
        console.log('My token: ' + JSON.stringify(token));
        localStorage.setItem("deviceToken", JSON.stringify(token));
      }
    );

    PushNotifications.addListener('registrationError',
      (error: any) => {
        alert('Error on registration: ' + JSON.stringify(error));
      }
    );

    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        const data = notification;
        console.log('Push received: ' + JSON.stringify(notification));
        this.mostrarToast(data.body);
      }
    );

    PushNotifications.addListener('pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        const data = notification.notification.data;
        console.log('Action performed: ' + JSON.stringify(notification.notification));
      }
    );

  }

  public RegisterFCM() {
    FCM.getToken()
    .then((r) => console.log(`Token ${r.token}`))
    .catch((err) => console.log(err));
    FCM.setAutoInit({ enabled: true }).then(() => console.log(`Auto init enabled`));

    FCM.isAutoInitEnabled().then((r) => {
    console.log('Auto init is ' + (r.enabled ? 'enabled' : 'disabled'));
    });
  }

  public SubcribeToTopic(topic:string){
    FCM.subscribeTo({ topic: topic })
    .then((r) => console.log(`subscribed to topic` + topic))
    .catch((err) => console.log(err));
  }
  
  public DeleteFCM(){
    this.setGroup()
    FCM.unsubscribeFrom({ topic: this.group })
    .then(() => console.log(`unsubscribed from topic` + this.group))
    .catch((err) => console.log(err));
  }

  public DeleteInstance(){
    FCM.deleteInstance()
    .then(() => console.log(`Token deleted`))
    .catch((err) => console.log(err));
  }

  async mostrarToast(mensaje) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000
    });
    toast.present();
  }
}
