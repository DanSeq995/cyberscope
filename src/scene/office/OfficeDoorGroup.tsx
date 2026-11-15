import { DOORS } from './doors'
import { Door } from './Door'

export function OfficeDoorGroup() {
  return (
    <group>
      {DOORS.map((spec) => (
        <Door key={spec.id} spec={spec} />
      ))}
    </group>
  )
}