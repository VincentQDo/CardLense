import type { Session, User } from 'better-auth';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: Session | undefined;
      user: User | undefined;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
