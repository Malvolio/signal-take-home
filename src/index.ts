import * as net from "net";
import { ArgumentParser } from "argparse";

const parser = new ArgumentParser({
  description: "Simple HTTP-CONNECT Proxy",
  add_help: true,
});

parser.add_argument("-b", "--bind", {
  help: "IP address to bind to (default 127.0.0.1)",
  default: "127.0.0.1",
});
parser.add_argument("-p", "--port", {
  help: "port to use (default 3000)",
  type: "int",
  default: 3000,
});
parser.add_argument("-v", "--verbose", {
  help: "print logging information",
  action: "store_true",
});
parser.add_argument("-H", "--hosts", {
  help: "allow access to these hosts (comma-separated)",
});

const { bind, port, verbose, hosts } = parser.parse_args();

/**
 * dummy out the logging if -v is not set
 */
const log = verbose ? console.log : () => {};

const allHosts = new Set<string>(hosts.split(",").map((s: string) => s.trim()));
const isConnectionAllowed = ({ host }: net.TcpNetConnectOpts) =>
  allHosts.has(host);

/**
 * Simple parser to find the destination host
 */
const parseConnect = (d: string): net.TcpNetConnectOpts | null => {
  const [connect] = d.split("\n").filter((s) => s.startsWith("CONNECT"));
  const [, path] = connect.split(" ");
  const [host, port] = path.split(":");
  return { host, port: Number.parseInt(port) || 443 };
};

net
  .createServer((socket) => {
    log("connection request received");
    let tunnel: net.Socket | null = null;
    const closeTunnel = () => {
      if (socket) {
        log("closing socket");
        socket.destroy();
        socket = null;
      }
      if (tunnel) {
        log("closing tunnel");
        tunnel.destroy();
        tunnel = null;
      }
    };

    socket.on("data", (data) => {
      if (tunnel) {
        log(`a outgoing packet of length ${data.length}`);
        tunnel.write(data);
      } else {
        const connectOpts = parseConnect(data.toString());
        if (!connectOpts) {
          log("host not understood");
          socket.write("HTTP/1.1 400 Bad Request\n\n");
          socket.destroy();
        } else if (!isConnectionAllowed(connectOpts)) {
          log("host not allowed");
          socket.write("HTTP/1.1 502 Bad Gateway\n\n");
          socket.destroy();
        } else {
          tunnel = net.createConnection(connectOpts);
          tunnel.on("data", (data) => {
            log(`an incoming packet of length ${data.length}`);
            socket.write(data);
          });
          tunnel.on("close", closeTunnel);
          socket.write("HTTP/1.1 200 OK\n\n");
          log("tunnel opened");
        }
      }
    });

    socket.on("close", closeTunnel);
  })
  .listen(port, bind, 100);
