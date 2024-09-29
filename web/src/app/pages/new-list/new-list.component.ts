import { Router } from '@angular/router';
import { TaskService } from './../../task.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-new-list',
  templateUrl: './new-list.component.html',
  styleUrl: './new-list.component.scss'
})
export class NewListComponent implements OnInit {
  constructor(private TaskService: TaskService, private router: Router) { }
  ngOnInit(): void {
  }
  createList(title: string) {
    this.TaskService.createList(title).subscribe((task: any) => {
      console.log("response", task);
      this.router.navigate(['/lists', task._id])
    }
    )
  }
}
