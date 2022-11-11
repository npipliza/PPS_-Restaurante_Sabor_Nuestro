import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Photo } from '@capacitor/camera';
import { LoadingController, ToastController } from '@ionic/angular';
import { NgxSpinnerService } from 'ngx-spinner';
import { Usuario } from 'src/app/clases/usuario';
import { eRol } from 'src/app/enums/eRol';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CameraService } from 'src/app/services/camera.service';
import { NotificationsService } from 'src/app/services/notifications/notifications.service';
import { StorageService } from 'src/app/services/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { UserService } from 'src/app/services/user.service';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';

declare let window: any;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  form1: FormGroup;
  form2: FormGroup;
  user: Usuario;
  formSelected: number;
  imagenPerfil = '../../../assets/images/silueta.png';
  uploadProgress: number;
  hasErrorPerfil: boolean;
  anonimo:boolean;
 
  anonimoAux:boolean;
  showFaltaImg: boolean;
  mensaje:string="";
  correo:string="";
  random=0;
  constructor(
    private notificationService:NotificationsService,
    private authService: AuthService,
    public toastController: ToastController,
    private router: Router,
    private formBuilder: FormBuilder,
    private loadingController: LoadingController,
    private cameraService: CameraService,
    private storageService: StorageService,
    private userService: UserService,
    public toastSrv: ToastService,
    private spinner: NgxSpinnerService

  ) {
    this.user = new Usuario();
    this.user.apellido = '';
    this.user.dni = '';
    this.user.rol = eRol.CLIENTE;
    this.user.aceptado = false;

    this.formSelected = 1;
    this.hasErrorPerfil = false;
    this.anonimo = false;
  }

  ngOnInit() {
    this.createForm();
  }

  tomarFotoPerfil() {
    this.addPhotoToGallery();
  }

  escanearClick() {
    window.cordova.plugins.barcodeScanner.scan(
      (result) => {
        var dniData = result.text.split('@');
        this.form1.patchValue({
          name: dniData[2],
          lastName: dniData[1],
          dni: dniData[4],
        });
      },
      (err) => {
        console.log(err);
        this.presentToast('Error al escanear el DNI', 'warning');
      },
      {
        showTorchButton: true,
        prompt: 'Scan your code',
        formats: 'PDF_417',
        resultDisplayDuration: 2,
      }
    );
  }

  createForm() {
    this.form1 = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required,Validators.minLength(2)]],
      dni: [
        '',
        [
          Validators.required,
          Validators.max(999999999),
          Validators.min(1000000),
          Validators.pattern('^[0-9]*$'),
        ],
      ],
    });

    this.form2 = this.formBuilder.group(
      {
        email: ['', [Validators.required, Validators.email]],
        pass1: ['', [Validators.required, Validators.minLength(6)]],
        pass2: ['', [Validators.required, Validators.minLength(6)]],
      },
      {
        validator: this.MustMatch('pass1', 'pass2'),
      }
    );
  }

  async registrarseClick() {
    emailjs.init("PTjtXE68V_2NFAQOu");
    this.spinner.show()
    this.authService
      .CreaterUser(this.user.correo, this.getPass1Control().value)
      .then((credential) => {
        this.userService.setItemWithId(this.user, credential.user.uid);
        this.spinner.hide()
        this.notificationService.sendNotification(
          "Registro Pendiente",
          "Hay un nuevo cliente que espera la aprobación de su registro",
          "supervisor"
        );
        this.mensaje="Tu cuenta esta en proceso de aprobación";
        emailjs.send('default_service', 'template_doiem9o',{"nombre":this.user.nombre,"email":this.user.correo,"mensaje":this.mensaje})
        .then((result: EmailJSResponseStatus) => {
          console.log(result.text);
        }, (error) => {
          console.log(error.text);
        });
        if(this.user.aceptado){
          this.router.navigate(['home-clientes']);
        }else
        {
          this.toastSrv.presentToast("Tu cuenta esta en proceso de aprobación.", 2500, "success");
          this.router.navigate(['login']);
        }
        
      })
      .catch((err) => {
        console.log(err);
        this.spinner.hide()
        this.presentToast('Ese correo ya está registrado', 'warning');
      })
      .finally(() => {
      });
  }




  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      color: 'warning',
      message: message,
      duration: 2000,
    });
    toast.present();
  }

  getEmailControl() {
    return this.form2.controls['email'];
  }
  getPass1Control() {
    return this.form2.controls['pass1'];
  }
  getPass2Control() {
    return this.form2.controls['pass2'];
  }

  getNameControl() {
    return this.form1.controls['name'];
  }
  getLastNameControl() {
    return this.form1.controls['lastName'];
  }
  getDniControl() {
    return this.form1.controls['dni'];
  }

  goToLogin() {
    this.router.navigate(['login']);
    this.ngOnInit();
  }

  goTo(idPage: number) {
    switch (idPage) {
      case 0:
        this.goToLogin();
        break;
      case 1:
        this.formSelected = 1;
        break;
      case 2:
        if (this.user.img_src != null) {
          this.formSelected = 2;
        } else {
          this.hasErrorPerfil = true;
        }

        break;
    }
  }

  async addPhotoToGallery() {
    const photo = await this.cameraService.addNewToGallery();
    this.uploadPhoto(photo)
      .then()
      .catch((err) => {
        console.log(err);
      });
  }

  private async uploadPhoto(cameraPhoto: Photo) {
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();
    const filePath = this.getFilePath();

    const uploadTask = this.storageService.saveFile(blob, filePath);

    uploadTask
      .then(async (res) => {
        const downloadURL = await res.ref.getDownloadURL();
        this.user.img_src = downloadURL;
        this.hasErrorPerfil = false;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  getFilePath() {
    return new Date().getTime() + '-test';
  }

  MustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors.mustMatch) {
        return;
      }
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  setAnonimo(){
    if(this.anonimo)
    {
      this.anonimoAux=false;
    }else
    {
      this.anonimoAux=true;
    }
    this.anonimo=this.anonimoAux;
  }

  isForm1Invalid():boolean{
    let invalid:boolean = this.anonimo;
    if(this.anonimo){
      this.random=Math.floor(Math.random() * 100) + 1;
      this.correo="anonimo"+this.random+"@gmail.com";
      this.user.correo=this.correo;
      this.form2.controls['pass1'].setValue('qweqwe')
      this.form2.controls['pass2'].setValue('qweqwe')
      this.user.aceptado=true;
  
       if(this.user.img_src != null && this.getNameControl().valid){
        invalid = false;
      }else
      {
        invalid = true;
      }

    }else{
      invalid = this.form1.invalid;
    }
 
    return invalid;
  }
}