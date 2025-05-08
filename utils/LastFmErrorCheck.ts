const LastFmErrorCheck = (e: number, userName: string): string => {
  if (!e && !userName) {
    return "Please inform a valid Last.fm username.";
  } else if (e) {
    switch (e) {
      case 2:
        return "Invalid service - This service does not exist";
        break;
      case 3:
        return "Invalid Method - No method with that name in this package";
        break;
      case 4:
        return "Authentication Failed - You do not have permissions to access the service";
        break;
      case 5:
        return "Invalid format - This service doesn't exist in that format";
        break;
      case 6:
        return "Invalid parameters - Your request is missing a required parameter";
        break;
      case 7:
        return "Invalid resource specified";
        break;
      case 8:
        return "Operation failed - Something else went wrong";
        break;
      case 9:
        return "Invalid session key - Please re-authenticate";
        break;
      case 10:
        return "Invalid API key - You must be granted a valid key by last.fm";
        break;
      case 11:
        return "Service Offline - This service is temporarily offline. Try again later.";
        break;
      case 13:
        return "Invalid method signature supplied";
        break;
      case 16:
        return "There was a temporary error processing your request. Please try again";
        break;
      case 26:
        return "Suspended API key - Access for your account has been suspended, please contact Last.fm";
        break;
      case 29:
        return "Rate limit exceeded - Your IP has made too many requests in a short period";
        break;
    }
  }
  return "";
};

export default LastFmErrorCheck;
