export const removeCodec = (sdp: string, codecToRemove = 'h264'): string => {
  const lines = [];
  const codecRegex = new RegExp(`/^a=rtpmap:(\d+) ${codecToRemove}/`, 'i');
  let mline = -1;
  let rtpRegex: RegExp | null = null;
  let rtpId = '';
  for (const line of sdp.split('\n')) {
    const match = line.match(codecRegex);
    if (line.startsWith('m=video')) {
      mline = lines.push(line) - 1;
    } else if (match) {
      rtpId = match[1];
      rtpRegex = new RegExp(`^a=(rtpmap|rtcp-fb|fmtp):${rtpId}`);
    } else if (!rtpRegex || !line.match(rtpRegex)) {
      lines.push(line);
    }
  }
  if (mline >= 0 && rtpId) {
    lines[mline] = lines[mline].replace(' ' + rtpId, '');
  }
  return lines.join('\n');
};
