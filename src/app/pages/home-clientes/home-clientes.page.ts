import { Component, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Mesa } from 'src/app/clases/mesa';
import { eEstadoMesa } from 'src/app/enums/eEstadoMesa';
import { eEstadoMesaCliente } from 'src/app/enums/eEstadoMesaCliente';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MesasService } from 'src/app/services/mesas/mesas.service';
import { PedidosService } from 'src/app/services/pedidos/pedidos.service';
import { ProductosService } from 'src/app/services/productos/productos.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { NotificationsService } from 'src/app/services/notifications/notifications.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Vibration } from '@ionic-native/vibration/ngx';
declare let window: any;

@Component({
  selector: 'app-home-clientes',
  templateUrl: './home-clientes.page.html',
  styleUrls: ['./home-clientes.page.scss'],
})
export class HomeClientesPage implements OnInit {

  public currentUser: any;
  public isOnEspera: boolean = false; 
  public isOnMesa: boolean = false; 
  public mesas: any;
  public mesasCliente: Array<any>;
  public productos: Array<any>;
  public comanda: Array<any>;
  public showCarta = false;
  public mesaSolicitada: Mesa;
  public docID_Mesa: string;
  public esperaID: string;
  public mesaCliente: any;
  public currentMesaCliente: any;
  public qrBtnText: string;
  public showCartaBtn: boolean = false;
  public showChatBtn: boolean = false;
  public showDetalleBtn: boolean = false;
  public showGamesBtn: boolean = false;
  public showEncuestaBtn: boolean = false;
  public espera_docid : string;
  showStatsBtn: boolean;

  constructor(public mesasSrv: MesasService,
    public prodSrv: ProductosService, 
    public pedidosSrv:PedidosService, 
    public authSrv: AuthService, 
    public router: Router, 
    public toastSrv:ToastService,
    public pushSrv: NotificationsService,
    private spinner: NgxSpinnerService, private vibration:Vibration
    ) {
    this.mesaSolicitada = new Mesa();
  }

  ionViewWillEnter(){
    this.ngOnInit()
  }

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem("userData"));
    this.pedidosSrv.TraerMesaCliente().subscribe( data =>{
      this.mesasCliente = data;
      this.isOnMesa = this.mesasCliente.some( x => {return x.user_uid == this.currentUser.uid})
      this.currentMesaCliente = this.mesasCliente.find( x =>  x.user_uid == this.currentUser.uid)
    });
    this.mesasSrv.TraerListaEspera().subscribe(data => {
      this.isOnEspera = data.some( x => x.user_uid === this.currentUser.uid) ? true : false;
      if(this.isOnEspera) this.espera_docid = (data.find( x => x.user_uid === this.currentUser.uid)).doc_id;
      this.qrBtnText = this.SetQrBtnText();
    });

    this.mesasSrv.TraerMesas().subscribe(data => {
      this.mesas = data;
    });
    console.log(this.currentUser);    
  }

  SetQrBtnText():string{
    let text;
    if (!this.isOnEspera && !this.isOnMesa) {
      text = "Escanee el QR para ponerse en lista de espera";
    }
    else{
      text = "Escanear Qr mesa";
    }
    return text;
  }

  logout(){
    this.authSrv.SignOut().then(()=>{
      this.router.navigate(['login']);
    })
  }

  ScanQr() {
    window.cordova.plugins.barcodeScanner.scan(
      (result) => {
        this.spinner.show()
        this.resolveAction(result.text);
      },
      (err) => {
        console.log(err);
      },
      {
        showTorchButton: true,
        prompt: 'Scan your code',
        formats: 'QR_CODE',
        resultDisplayDuration: 2,
      }
    );
  }

  AgregarProducto(index: any) {
    this.comanda.push(this.productos[index]);
    console.log(this.comanda);
  }

  resolveAction(text: string){
    console.log("Resolve action")
    const regex = /^[0-9]*$/;

    if (regex.test(text) == true) {
      var nro_Mesa = Number(text);
      text = "action-mesa"
    }

    switch (text) {
      case 'lista-espera':
        this.SolicitarMesa();
        break;
      case "action-mesa": 
        this.ResolveActionMesa(nro_Mesa);
        break;
      default:
          this.vibration.vibrate(1500);
          this.toastSrv.presentToast("El código escaneado es inválido", 2500, "danger")
        break;
    }
  }

  ResolveActionMesa(nro_mesa:number){
    if (this.isOnEspera) {
      this.asignarMesa(nro_mesa);
    }
    else if(this.isOnMesa){
      if (this.currentMesaCliente.nro_mesa == nro_mesa) {
        this.ResolveActionInMesa();
      } else {
        this.spinner.hide();        
        this.toastSrv.presentToast("Por favor, no escanee códigos de otras mesas", 2500, "danger");
        this.vibration.vibrate(1500);
      }
    }
    else{
      this.spinner.hide();      
      this.toastSrv.presentToast("Por favor, póngase en lista de espera", 2500, "danger");
      this.vibration.vibrate(1500);
    }

  }

  ResolveActionInMesa(){
    if (this.currentMesaCliente.estado == eEstadoMesaCliente.SENTADO) {
      this.showCartaBtn = true;
      this.showChatBtn = true;
      this.spinner.hide();
    }
    else if (this.currentMesaCliente.estado == eEstadoMesaCliente.CONFIRMANDO_PEDIDO) {
      this.showChatBtn = true;
      this.showDetalleBtn = true;
      this.spinner.hide();
    }
    else if (this.currentMesaCliente.estado == eEstadoMesaCliente.ESPERANDO_PEDIDO) {
      this.showChatBtn = true;
      this.showDetalleBtn = true;
      this.showGamesBtn = true;
      this.showEncuestaBtn = true;
      this.showStatsBtn = true;
      this.spinner.hide();
    }
    else if(this.currentMesaCliente.estado == eEstadoMesaCliente.PEDIDO_ENTREGADO) {
      this.showChatBtn = true;
      this.showDetalleBtn = true;
      this.showGamesBtn = true;
      this.showEncuestaBtn = true;
      this.showStatsBtn = true;
      this.spinner.hide();
    }
    else if(this.currentMesaCliente.estado == eEstadoMesaCliente.COMIENDO) {
      this.showChatBtn = true;
      this.showDetalleBtn = true;
      this.showGamesBtn = true;
      this.showEncuestaBtn = true;
      this.showStatsBtn = true;
      this.spinner.hide();
    }
    else if(this.currentMesaCliente.estado == eEstadoMesaCliente.PAGANDO) {
      this.showDetalleBtn = true;
      this.showEncuestaBtn = true;
      this.showChatBtn = true;
      this.showStatsBtn = true;
      this.spinner.hide();
    }
    

  }

  SolicitarMesa() {
    this.spinner.hide();
    if (!this.isOnEspera) {
      this.mesasSrv.SolicitarMesa(this.currentUser);
      this.toastSrv.presentToast("Se ingresó a lista de espera con éxito", 2500, "success");
      this.pushSrv.sendNotification("Hay nuevos clientes en lista de espera",this.currentUser.nombre + " ingreso a la lista de espera.",'mozo')
    } else {
      this.vibration.vibrate(1500);
      this.toastSrv.presentToast("Usted ya se encuentra en lista de espera", 2000,'warning');
    }
  }

  asignarMesa(nro_mesa: number) {
    if (this.isOnEspera) {
      this.getMesa(nro_mesa);
      if (this.mesaSolicitada.estado == eEstadoMesa.LIBRE) {
          this.mesasSrv.ActualizarMesaEstado(this.docID_Mesa, eEstadoMesa.OCUPADA);
          this.mesasSrv.AsignarMesaCliente(nro_mesa, this.docID_Mesa, this.currentUser.uid);
          this.mesasSrv.EliminarClienteListaEspera(this.espera_docid);
          this.showCartaBtn = true;
          this.showChatBtn = true;
          this.spinner.hide();
          this.toastSrv.presentToast("Ingresaste a la mesa " + nro_mesa, 2000,'success');
      } else {
        this.spinner.hide();
        
        this.toastSrv.presentToast("La mesa escaneada se encuentra OCUPADA", 2000,'warning');
        this.vibration.vibrate(1500);
      }
    } else {
      this.spinner.hide();
      
      this.toastSrv.presentToast("No se encuentra en lista de espera...", 2000,'warning');
      this.vibration.vibrate(1500);
    }
  }

  getMesa(nro_mesa: number) {

    this.mesas.forEach(m => {
      if (m.nro_mesa == nro_mesa) {

        this.mesaSolicitada.comensales = m.comensales;
        this.mesaSolicitada.estado = m.estado;
        this.mesaSolicitada.nro_mesa = m.nro_mesa;
        this.mesaSolicitada.tipo_mesa = m.tipo_mesa;
        this.docID_Mesa = m.doc_id_mesa;
      }
    });
  }

  MesaHasCliente(nro_mesa): boolean {
    var retorno = true;

    this.mesaCliente.forEach(mc => {
      if (mc.nro_mesa == nro_mesa) {
        if (mc.estadoMesaCliente == eEstadoMesaCliente.SENTADO) {
          retorno = false;
        }
      }

    });
    return retorno;
  }

  navigateCarta(){
    this.router.navigate(['carta', {mesa: this.currentMesaCliente.nro_mesa}])
  }

  navigateDetalle(){
    this.router.navigate(['detalle-pedido', {doc_id: this.currentMesaCliente.doc_id}])
  }

  goToChat(){
    this.router.navigate(['cliente/chat']);
  }
  goToGame(){
    if (!this.currentMesaCliente.ganoJuego) {
      this.router.navigate(['cliente/game']);
    }
    else{
      this.toastSrv.presentToast("Usted ya participo del juego..", 2500, "warning")
    }
  }

  goToEncuesta(){
    if(this.currentMesaCliente.hasEncuesta){
      this.vibration.vibrate(1500);
      this.toastSrv.presentToast("Usted ya ha completado la encuesta", 2000,'warning');
    }else{
      this.router.navigate(['cliente/encuesta', {mesaClienteId: this.currentMesaCliente.doc_id}]);
    }
  }

  goToEstadisticas(){
    this.router.navigate(['cliente/estadisticas']);
  }
}
