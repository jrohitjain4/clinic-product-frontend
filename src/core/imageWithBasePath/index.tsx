
import { img_path } from '../../environment';
import { resolveMediaUrl } from '../config/api';


interface Image {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?: string;
  style?: React.CSSProperties;
}

const ImageWithBasePath = (props: Image) => {
  const fullSrc =
    props.src.startsWith("/uploads") ||
    props.src.startsWith("http://") ||
    props.src.startsWith("https://")
      ? resolveMediaUrl(props.src)
      : `${img_path}${props.src}`;
  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
      style={props.style}
    />
  );
};

export default ImageWithBasePath;
