import { Random } from 'random';

const random = new Random();

export function generatePassword() {
    const password = random.int(0, 999999).toString().padStart(6, '0');
    return password;
}
