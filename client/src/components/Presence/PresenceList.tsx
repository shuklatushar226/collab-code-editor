import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';
import clsx from 'clsx';

export default function PresenceList() {
  const { users } = useRoomStore();
  const { user: currentUser } = useUserStore();
  const userList = Array.from(users.values());

  return (
    <div className="flex items-center gap-1 px-3">
      {userList.map((u) => (
        <div
          key={u.id}
          title={`${u.name}${u.id === currentUser?.id ? ' (you)' : ''} — ${u.role}`}
          className={clsx(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white',
            'ring-2 ring-offset-1 ring-offset-editor-sidebar cursor-default transition-all',
            !u.isOnline && 'opacity-50 grayscale'
          )}
          style={{
            backgroundColor: u.color,
            outline: `2px solid ${u.color}`,
            outlineOffset: '1px',
          }}
        >
          {u.name.charAt(0).toUpperCase()}
        </div>
      ))}
      <span className="text-xs text-gray-500 ml-1">{userList.length} online</span>
    </div>
  );
}
