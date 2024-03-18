/** Socket incoming message data */
export default interface MessageNetData {

    /** Message sender */
    role: 'teammate' | 'enemy' | 'system';

    /** Message content */
    text: string;
}
