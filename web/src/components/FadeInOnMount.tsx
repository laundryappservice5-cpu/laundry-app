import { useEffect, useState, type ReactNode } from 'react';
import { Fade } from '@mui/material';

export function FadeInOnMount({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <Fade in={show} timeout={220}>
      <div>{children}</div>
    </Fade>
  );
}
