package de.lukaskoerfer.jira.capito;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.MediaType;

import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.issue.Issue;
import com.atlassian.jira.project.Project;
import com.atlassian.jira.project.ProjectManager;
import com.atlassian.jira.project.version.Version;
import com.atlassian.jira.project.version.VersionManager;
import com.atlassian.jira.util.json.JSONArray;
import com.atlassian.jira.util.json.JSONException;
import com.atlassian.jira.util.json.JSONObject;

@SuppressWarnings("serial")
public class UclfServlet extends HttpServlet {

	// Define the ISO date format
    private static final SimpleDateFormat IsoDate = new SimpleDateFormat("yyyy/MM/dd");
   
    private VersionManager VersionManager;
    private ProjectManager ProjectManager;
 
    public UclfServlet() {
        // Import the required JIRA components
        this.ProjectManager = ComponentAccessor.getProjectManager();
        this.VersionManager = ComponentAccessor.getVersionManager();
    }
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// Search the project
        Project project = this.ProjectManager.getProjectByCurrentKey(request.getParameter("project"));
        // Project with given key does not exist
        if (project == null) {
            this.respond(response, HttpServletResponse.SC_NOT_FOUND, MediaType.TEXT_PLAIN, "Project not found");
            return;
        }
        // Build the JSON / UCLF changelog
        JSONObject changelog = new JSONObject();
        try {
            changelog.put("name", project.getName());
            changelog.put("uclf", true);
            JSONArray versions = new JSONArray();
            // For each version
            for (Version vs : this.VersionManager.getVersions(project)) {
                JSONObject version = new JSONObject();
                version.put("name", vs.getName());
                Date release = vs.getReleaseDate();
                version.put("date", release != null ? IsoDate.format(release) : "");
                JSONArray changes = new JSONArray();
                // For each change / issue
                for (Issue issue : this.VersionManager.getIssuesWithFixVersion(vs)) {
                    JSONObject change = new JSONObject();
                    change.put("description", issue.getSummary());
                    change.put("category", issue.getIssueType().getNameTranslation());
                    change.put("tags", new JSONArray());
                    changes.put(change);
                }
                version.put("changes", changes);
                versions.put(version);
            }
            changelog.put("versions", versions);
        } catch (JSONException jsonex) {
            // JSON serialization problem
            this.respond(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, MediaType.TEXT_PLAIN, "JSON serialization failed");
            return;
        }
        this.respond(response, HttpServletResponse.SC_OK, MediaType.APPLICATION_JSON, changelog.toString());
    }
   
    private void respond(HttpServletResponse response, int status, String mime, String content) throws IOException {
        response.setStatus(status);
        response.setContentType(mime);
        response.getWriter().write(content);
    }
	
}
