// src/components/Iconos.jsx
// ============================================================
// Iconos SVG inline (estilo Heroicons / Tailwind).
// Se hereda el color con currentColor, por lo que basta con
// aplicar clases de texto (text-white, text-primary, etc).
// ============================================================
const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  strokeWidth: 1.8,
  stroke: 'currentColor',
  'aria-hidden': true,
};

function Svg({ children, className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...base}>
      {children}
    </svg>
  );
}

export function IconoBeaker({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.692 3.204-1.08 3.472a18.96 18.96 0 0 1-8.617 0c-1.772-.268-2.312-2.24-1.08-3.472L9 16.5M3 18.5h18" />
    </Svg>
  );
}

export function IconoUsers({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </Svg>
  );
}

export function IconoUser({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </Svg>
  );
}

export function IconoCog({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </Svg>
  );
}

export function IconoClock({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </Svg>
  );
}

export function IconoCheck({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </Svg>
  );
}

export function IconoPlus({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </Svg>
  );
}

export function IconoEdit({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </Svg>
  );
}

export function IconoTrash({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </Svg>
  );
}

export function IconoSearch({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </Svg>
  );
}

export function IconoChart({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </Svg>
  );
}

export function IconoRefresh({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.836c.633 0 1.14.513 1.14 1.146 0 .628-.504 1.141-1.137 1.141H15.4a8.96 8.96 0 0 1-6.364-2.632 9.043 9.043 0 0 1-1.98-2.633m9.945 10.137c-.621 0-1.125-.504-1.125-1.125v-4.875c0-.621.504-1.125 1.125-1.125h4.875c.621 0 1.125.504 1.125 1.125v4.875a1.125 1.125 0 0 1-1.125 1.125h-3.375m-9.945-8.137A8.96 8.96 0 0 1 7.636 4.668 9.043 9.043 0 0 1 9.616 2.035m9.945 8.137L16.5 12" />
    </Svg>
  );
}

export function IconoLock({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </Svg>
  );
}

export function IconoShield({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </Svg>
  );
}

export function IconoPhone({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </Svg>
  );
}

export function IconoMail({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </Svg>
  );
}

export function IconoKey({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-6.75 5.94M15.75 5.25a3 3 0 0 0-3 3m3-3v6.75m-9 3.75a3 3 0 1 1 6 0v1.5a3 3 0 0 1-6 0V15Z" />
    </Svg>
  );
}

export function IconoX({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </Svg>
  );
}

export function IconoExclamation({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </Svg>
  );
}

export function IconoEye({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </Svg>
  );
}

export function IconoHome({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125a1.125 1.125 0 0 0 1.125 1.125H9.75v-4.875a1.125 1.125 0 0 1 1.125-1.125h2.25a1.125 1.125 0 0 1 1.125 1.125v4.875h4.125a1.125 1.125 0 0 0 1.125-1.125V9.75M8.25 21h8.25" />
    </Svg>
  );
}

export function IconoCalendar({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </Svg>
  );
}

export function IconoClipboardDocument({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h.75m3.75 0h.375a2.25 2.25 0 0 1 2.25 2.25v.375a2.25 2.25 0 0 1-2.25 2.25h-.375m3.75 0h.375a2.25 2.25 0 0 1 2.25 2.25v.375a2.25 2.25 0 0 1-2.25 2.25h-.375m-12 3.75h.375a2.25 2.25 0 0 0 2.25-2.25v-.375a2.25 2.25 0 0 0-2.25-2.25h-.375a2.25 2.25 0 0 0-2.25 2.25v.375a2.25 2.25 0 0 0 2.25 2.25h.375m12-9h.375a2.25 2.25 0 0 1 2.25 2.25v.375a2.25 2.25 0 0 1-2.25 2.25h-.375a2.25 2.25 0 0 1-2.25-2.25v-.375A2.25 2.25 0 0 1 18 9h.375M3.75 15.75h16.5" />
    </Svg>
  );
}

export function IconoHeart({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </Svg>
  );
}

export function IconoStethoscope({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 6.375a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM18.75 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM9 21.75a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM15.75 3.75a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM3.375 13.125a2.625 2.625 0 1 1 5.25 0 2.625 2.625 0 0 1-5.25 0Zm13.5 0a2.625 2.625 0 1 1 5.25 0 2.625 2.625 0 0 1-5.25 0Z" />
    </Svg>
  );
}

export function IconoPill({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 17.25 11.25V9a2.25 2.25 0 0 0-2.25-2.25H13.5m-3-3L9 1.5m6 0-3 3m0 0h3.75A2.25 2.25 0 0 1 21 6.75v7.5a2.25 2.25 0 0 1-2.25 2.25H16.5m0-12.75L13.5 3m0 0 3 3m0-3h3.75A2.25 2.25 0 0 1 21 6.75v7.5a2.25 2.25 0 0 1-2.25 2.25H16.5m0-12.75v12.75" />
    </Svg>
  );
}

export function IconoBuildingHospital({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6v.75a2.25 2.25 0 0 1-2.25 2.25h-1.5A2.25 2.25 0 0 1 15 9.75V15h3.75a2.25 2.25 0 0 1 2.25 2.25v1.5a2.25 2.25 0 0 1-2.25 2.25h-1.5A2.25 2.25 0 0 1 15 21v-7.5M3 9h18M3 9v11.25a2.25 2.25 0 0 0 2.25 2.25h1.5A2.25 2.25 0 0 0 9 20.25V9" />
    </Svg>
  );
}

export function IconoDocumentText({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625A2.625 2.625 0 0 0 3 8.625v11.25A2.625 2.625 0 0 0 5.625 22.5h13.5A2.625 2.625 0 0 0 21.75 19.875V8.625A2.625 2.625 0 0 0 19.125 6H15m2.25 0v2.625a2.25 2.25 0 0 1-2.25 2.25H15m0 0h2.625a2.25 2.25 0 0 1 2.25 2.25v2.625m0 0v2.625" />
    </Svg>
  );
}

export function IconoArchiveBox({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </Svg>
  );
}

export function IconoUserGroup({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </Svg>
  );
}

export function IconoArrowDown({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </Svg>
  );
}

export function IconoArrowUp({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </Svg>
  );
}

export function IconoArrowRight({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 20.25l6.75-6.75M21 12H3" />
    </Svg>
  );
}

export function IconoBanknotes({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v4.5a2.25 2.25 0 0 0 2.25 2.25h15.75a2.25 2.25 0 0 0 2.25-2.25V4.5m-19.5 0h19.5" />
    </Svg>
  );
}

export function IconoBuildingBank({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m-1.5 3h1.5M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </Svg>
  );
}

export function IconoCreditCard({ className }) {
  return (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3 2.25h2.25m10.5-9.75h6.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-6.375m0-9.75L16.5 12m0 0l2.25 2.25M16.5 12l-2.25 2.25" />
    </Svg>
  );
}
