import { WebRequestService } from './web-request.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private WebRequestService: WebRequestService) { }
  getLists() {
    return this.WebRequestService.get('lists');
  }
  createList(title: string) {
    return this.WebRequestService.post('lists', { title });
  }
  updateList(id: string, title: string) {
    return this.WebRequestService.patch(`lists/${id}`, { title });
  }
  deleteList(id: string) {
    return this.WebRequestService.delete(`lists/${id}`);
  }
  getTasks(listId: string) {
    return this.WebRequestService.get(`lists/${listId}/tasks`);
  }
  createTasks(title: string, listId: string) {
    return this.WebRequestService.post(`lists/${listId}/tasks`, { title });
  }
  updateTask(listId: string, taskId: string, title: string) {
    return this.WebRequestService.patch(`lists/${listId}/tasks/${taskId}`, { title });
  }
  deleteTask(listId: string, taskId: string) {
    return this.WebRequestService.delete(`lists/${listId}/tasks/${taskId}`);
  }
  complete(task: any) {
    return this.WebRequestService.patch(`lists/${task._listId}/tasks/${task._id}`, {
      completed: !task.completed
    })
  }
}
