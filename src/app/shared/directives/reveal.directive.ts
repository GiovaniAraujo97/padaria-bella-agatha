import { Directive, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const element = this.element.nativeElement;
    element.classList.add('reveal');

    if (!this.isBrowser || !('IntersectionObserver' in window)) {
      element.classList.add('is-visible');
      return;
    }
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('is-visible');
        this.observer?.unobserve(element);
      }
    }, { threshold: 0.12 });
    this.observer.observe(element);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}