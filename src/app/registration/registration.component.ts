import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegistrationService, User } from './registration.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit {
  registrationForm!: FormGroup;
  countries: string[] = [];
  usernameTaken = false;
  registrationSuccessful = false;
  users: User[] = [];

  constructor(
    private fb: FormBuilder,
    private registrationService: RegistrationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCountries();
    this.loadUsers();
    this.setupUsernameListener();
  }

  // Initialize the form
  private initForm(): void {
    this.registrationForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-z0-9]+$'),
          Validators.maxLength(20),
        ],
      ],
      country: ['India', Validators.required],
    });
  }

  // Load countries
  private loadCountries(): void {
    this.registrationService.getCountries().subscribe({
      next: (countries) => (this.countries = countries),
      error: (err) => console.error('Error loading countries', err),
    });
  }

  // Load users
  private loadUsers(): void {
    this.registrationService.getAllUsers().subscribe({
      next: (users) => (this.users = users),
      error: (err) => console.error('Error loading users', err),
    });
  }

  // Listen to username field changes and validate
  private setupUsernameListener(): void {
    this.registrationForm
      .get('username')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((username) =>
          username ? this.registrationService.checkUsername(username) : of(true)
        )
      )
      .subscribe({
        next: (available) => (this.usernameTaken = !available),
        error: (err) =>
          console.error('Error checking username availability', err),
      });
  }

  // Handle form submission
  onSubmit(): void {
    if (this.registrationForm.valid && !this.usernameTaken) {
      const formData: User = this.registrationForm.value;
      this.registrationService.registerUser(formData).subscribe({
        next: () => {
          this.registrationSuccessful = true;
          this.resetForm();
          this.loadUsers();
        },
        error: (err) => console.error('Registration failed:', err),
      });
    }
  }

  // Reset local storage and in-memory database
  resetLocalStorage(): void {
    this.users = [];
    this.registrationService.resetDb().subscribe({
      next: () => {
        this.loadUsers();
        this.registrationSuccessful = false;
      },
      error: (err) => console.error('Error resetting database', err),
    });
  }

  // Reset form after successful submission
  private resetForm(): void {
    this.registrationForm.reset();
    this.usernameTaken = false;
  }
}
