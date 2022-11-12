import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UserService } from 'src/app/services/user.service';
@Component({
  selector: 'app-home-metre',
  templateUrl: './home-metre.page.html',
  styleUrls: ['./home-metre.page.scss'],
})
export class HomeMetrePage implements OnInit {

  clientes:any[];
  mensaje:string="";

  constructor(private userService:UserService, 
    private authService:AuthService,
    private router:Router) { 
    this.clientes = [];
  }

  ngOnInit() {
    this.getUsers();
  }

  private getUsers(){
    this.userService.getMesaClienteByStatus(false)
    .then((querySnapshot)=>{      
      this.clientes = querySnapshot.docs.map(d => {
        return {
          id:d.id,
          user:d.data()
        };
      });
    })
    .catch((err)=>{
      console.log(err);
    })
    .finally(()=>{

    })
  }

  saveUser(item:any){
    this.userService.setItemWithId(item.user, item.id)
  }
 

  aceptarCliente(aceptar:boolean, item:any){
  
      if(aceptar){
        item.user.estado = "SENTADO"; 
        this.mensaje='Tu cuenta fue habilitada, ya puedes iniciar sesión correctamente';
    

        this.userService.setItemWithId(item.user, item.id).then(()=>{
          this.getUsers();
        });
      }
      else{
        
        this.userService.deleteItem(item.id).then(()=>{
          this.getUsers();
        });
        this.getUsers();
      }   
   
  }

  logout(){
    this.authService.SignOut().then(()=>{
      this.router.navigate(['login']);
    })
  }

  return(){
    this.router.navigate(['supervisor/home']);
  }

}
