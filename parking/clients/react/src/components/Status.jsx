const ERROR_COLOR = '#8a2b1f';

// status is { text, isError } or null.
export default function Status({ status }) {
  return (
    <p className="status" style={{ color: status?.isError ? ERROR_COLOR : undefined }}>
      {status?.text}
    </p>
  );
}
