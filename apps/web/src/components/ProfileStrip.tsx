import type { Profile } from '@livebio/core';

export function ProfileStrip({ profile }: { profile: Profile }) {
  const stats: Array<[string, number]> = [
    ['repositories', profile.publicRepos],
    ['stars', profile.totalStars],
    ['followers', profile.followers],
    ['following', profile.following],
  ];
  return (
    <section className="strip" aria-label="Your GitHub profile">
      <img src={profile.avatarUrl} alt="" width={56} height={56} />
      <div className="strip-id">
        <strong>{profile.name ?? profile.login}</strong>
        <span>@{profile.login}</span>
      </div>
      <dl className="strip-stats">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value.toLocaleString('en-US')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
