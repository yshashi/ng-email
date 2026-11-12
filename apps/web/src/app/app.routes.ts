import type { Routes } from "@angular/router";

import {
  allTemplatesResolver,
  catalog,
  categories,
  categoryResolver,
  homeResolver,
  templateResolver,
} from "./registry";

export const routes: Routes = [
  {
    path: "",
    title: "ng-email: email templates as Angular components",
    resolve: { welcome: homeResolver },
    loadComponent: () => import("./pages/home").then((m) => m.HomePage),
  },
  {
    path: "components",
    title: "Components · ng-email",
    loadComponent: () =>
      import("./pages/components-index").then((m) => m.ComponentsIndexPage),
  },
  {
    path: "components/:category",
    resolve: { data: categoryResolver },
    // Titles run alongside resolvers, so read the bundled catalog, not resolved data.
    title: (route) =>
      `${categories.find((c) => c.slug === route.paramMap.get("category"))?.name ?? "Components"} · ng-email`,
    loadComponent: () => import("./pages/category").then((m) => m.CategoryPage),
  },
  {
    path: "templates",
    title: "Templates · ng-email",
    resolve: { templates: allTemplatesResolver },
    loadComponent: () =>
      import("./pages/templates-index").then((m) => m.TemplatesIndexPage),
  },
  {
    path: "templates/:name",
    resolve: { item: templateResolver },
    title: (route) =>
      `${catalog.find((e) => e.name === route.paramMap.get("name"))?.title ?? "Template"} template · ng-email`,
    loadComponent: () =>
      import("./pages/template-detail").then((m) => m.TemplateDetailPage),
  },
  {
    path: "**",
    title: "Page not found · ng-email",
    loadComponent: () =>
      import("./pages/not-found").then((m) => m.NotFoundPage),
  },
];
