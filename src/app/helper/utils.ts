export class Utils {
    static get isServing() {
        return window.location.href.startsWith("http");
    }
}