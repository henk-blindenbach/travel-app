type Props = {
  url: string;
  label: string;
  className?: string;
};

/** Short public follow-line linking to an optional trip Polarsteps URL. */
export function PolarstepsFollowLink({ url, label, className }: Props) {
  return (
    <p className={className ? className : "polarsteps-follow"}>
      <a href={url} rel="noopener noreferrer" target="_blank">
        {label}
      </a>
    </p>
  );
}
