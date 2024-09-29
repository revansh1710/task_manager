import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  constructor(private authService: AuthService) { }
  ngOnInit() {

  }
  onSignupClick(email: string, password: string) {
    this.authService.signUp(email, password).subscribe((res: HttpResponse<any>) => {
      console.log(res);
    })
  }
}
