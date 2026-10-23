export interface Testimonial {
  /** GitHub username of the person who wrote it. */
  login: string;
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
}

/**
 * Reviews from real users, added by the maintainer after someone submits one with the "Share your
 * experience" form on GitHub and agrees to have it shown. Never write one here that was not submitted.
 * While this list is empty the site says so, instead of showing made-up praise.
 */
export const TESTIMONIALS: Testimonial[] = [];
