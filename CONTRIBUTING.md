# Contributing

## Setting up

You need Node 24 and pnpm 12.

```sh
pnpm install
```

| What | Command |
| --- | --- |
| Type-check | `pnpm check` |
| Build the package into `dist/` | `pnpm build` |
| Build, then check every palette's contrast | `pnpm test` |
| See every palette | `pnpm build`, then serve the repository (`python3 -m http.server`) and open `/preview/` |

## Trying a change in an application

Before releasing, try the change in Honk or Hindsight the way npm would deliver it:

```sh
pnpm pack --pack-destination /tmp/palettes-1   # a new folder for every try
cd ../hindsight && pnpm add /tmp/palettes-1/itrium-palettes-<version>.tgz
```

pnpm remembers a local package by its path, so a rebuilt package packed to the same place is
silently ignored: use a new folder each time. Don't commit the `file:` dependency.

## Pull requests

Conventions are in [`.handbook/`](.handbook/), a link to Itrium's handbook: branch names, pull
request titles, labels. Every pull request runs `Test` (required) and attaches a screenshot of
the preview to the run.

## Versioning

[Semantic versioning](https://semver.org). Until 1.0.0, a minor version can change the API.

- **Patch:** a color adjusted, or a fix that changes nothing an application uses.
- **Minor:** a new palette or token, or anything an application has to change for.

Removing or renaming a token breaks every application that uses it, so it comes with a note on
what to use instead.

## Releasing

1. Set the version in `package.json` in a pull request, and merge it.
2. Draft the release on GitHub, with notes generated from the pull requests since the last
   version, grouped by their `type:` labels (`.github/release.yml`; chores are left out):

   ```sh
   gh release create v0.4.0 --draft --target main --generate-notes --title "Palettes 0.4.0"
   ```

   A draft is private and makes no tag yet.
3. Read the notes in the draft and edit them: add a line for anything an application has to do.
4. Publish the release. GitHub makes the tag, and `release.yml` checks the tag matches
   `package.json`, runs the checks again, and publishes to npm through trusted publishing, with a
   provenance attestation. The version, its tag and its notes go public together.
5. Update the applications in pull requests of their own, so their checks run on the new
   version.

**The first version** can't use trusted publishing, because npm only lets a package that
already exists trust a workflow. It's published once by hand, from the tagged commit:

```sh
git switch --detach v0.1.0 && pnpm install --frozen-lockfile && pnpm test
npm login
npm publish --access public
```

Then, on npmjs.com, the package's **Settings → Trusted publishing**: GitHub Actions, organization
`itriumid`, repository `palettes`, workflow `release.yml`. Every version after that comes from
the workflow. (Publishing a release for the first version still runs it; it sees the version is
already on npm and stops there.)
