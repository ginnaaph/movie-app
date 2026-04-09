# Profiles Page Notes

This document explains how the Profiles tab is structured in
[profiles.tsx](/Users/ginapham/movie-app/app/(tabs)/profiles.tsx) and why the
screen is built this way.

## Purpose

The current Profiles page is a scaffold.

It is not connected to a real user account yet, but it gives you a clean screen
structure you can later plug real data into:

- a profile header
- a small stats row
- quick action cards
- a support/settings section

This is a good pattern for mobile UI because it lets you build the layout first,
then replace static values with live data later.

## High-Level Structure

The page uses this layout:

1. A full-screen root `View` with the app background color.
2. A background `Image` using `StyleSheet.absoluteFillObject`.
3. A `ScrollView` so the page can grow vertically on smaller screens.
4. Three main content sections inside the scroll view.

That means the visual stack is:

- base screen container
- background image
- scrollable content on top

## Why `ScrollView` Is Used

The Profiles page is content-heavy compared to a simple placeholder.

Using `ScrollView` makes the page safer on smaller devices because the content
can extend past the viewport instead of being clipped. The `contentContainerStyle`
also adds bottom padding so the tab bar does not overlap the last section.

## Reusable Data Arrays

The screen starts with three arrays:

- `profileStats`
- `quickActions`
- `supportItems`

These arrays are important because they separate content from layout.

Instead of hardcoding each row manually, the component maps over arrays and
renders repeated UI blocks. This is easier to maintain and scale.

For example, this pattern:

```tsx
{profileStats.map((stat) => (
  <View key={stat.label}>
    ...
  </View>
))}
```

is better than duplicating three nearly identical blocks by hand.

## Section Breakdown

### 1. Profile Hero Card

The first large card contains:

- the page label (`Profile`)
- the user name
- a short bio/description
- a circular profile icon area

This section establishes hierarchy:

- small label first
- large bold name second
- supporting text third

The avatar area is currently a styled container using the existing `profile`
icon. Later you could replace this with:

- a real uploaded avatar
- initials from the logged-in user
- a generated profile image

### 2. Stats Row

Inside the hero card there is a second smaller panel for stats:

- Saved
- Watched
- Lists

This row is rendered from `profileStats`.

Each stat uses:

- a bold value
- a smaller muted label

This is a common dashboard pattern because it gives the user quick signals
without requiring detailed interaction.

### 3. Quick Actions

The Quick Actions section renders a list of tappable-looking cards with:

- title
- subtitle
- arrow icon

Right now these are presentational only. They are useful as scaffolding because
you can later turn each one into:

- a `TouchableOpacity`
- a `Link`
- a navigation action with `router.push(...)`

### 4. App & Support

This section is a simpler vertical list for secondary items like:

- Privacy & Security
- Help Center
- About Movie App

These items are visually quieter than Quick Actions, which helps preserve
hierarchy:

- primary actions get larger cards
- secondary/support options get simpler rows

## Styling Choices

The page follows the same visual language as the rest of the app:

- `bg-primary` for the screen base
- `images.navybg` for the textured background
- rounded cards with soft borders
- white text for primary content
- muted blue-gray text for supporting labels
- accent orange for highlights

This keeps the screen consistent with Home and Saved without duplicating those
screens exactly.

## Why Some Styles Use `StyleSheet`

Most styling is done with NativeWind utility classes.

The movie icon at the top uses `StyleSheet.create(...)` because it is a stable,
fixed-size style object and mirrors the pattern already used in other tabs like
Home and Saved.

That gives the project a consistent top-of-screen treatment.

## How To Replace Static Data With Real Data

When you are ready to make the page dynamic, the safest path is:

1. Replace `"Gina Pham"` and the bio with values from a user object.
2. Replace `profileStats` values with computed counts from your saved movies,
   watched history, or custom lists.
3. Convert `quickActions` rows into buttons or navigation links.
4. Move the arrays outside the component only if they remain static; if they
   depend on fetched data, derive them inside the component.

## Example Next Step

If you wanted the Saved stat to reflect real data, you could pass the saved
movie count into the page and build the array from that:

```tsx
const profileStats = [
  { label: "Saved", value: String(savedMovies.length) },
  { label: "Watched", value: "48" },
  { label: "Lists", value: "5" },
];
```

This is a small change, but it shows the value of the array-driven approach.

## Learning Takeaways

The main ideas to learn from this page are:

- use arrays plus `.map()` for repeated UI
- use `ScrollView` for vertically growing mobile layouts
- build sections with strong visual hierarchy
- scaffold with static data first, then connect real state later
- keep styling consistent with the rest of the app rather than inventing a new
  pattern for every tab

## Files To Reference

- [profiles.tsx](/Users/ginapham/movie-app/app/(tabs)/profiles.tsx)
- [saved.tsx](/Users/ginapham/movie-app/app/(tabs)/saved.tsx)
- [index.tsx](/Users/ginapham/movie-app/app/(tabs)/index.tsx)
